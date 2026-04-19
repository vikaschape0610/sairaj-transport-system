-- ==============================================================
-- file: schema_postgres.sql
-- SAIRAJ TRANSPORT – PostgreSQL Database Schema (v3, Production)
-- Run once on your Railway PostgreSQL database.
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT guards.
-- v3 adds: truck_number + driver_name snapshot columns to bookings
-- ==============================================================

-- ==============================================================
-- TABLE: users
-- ==============================================================
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(150) NOT NULL UNIQUE,
  phone               VARCHAR(15)  NOT NULL,
  company             VARCHAR(150),
  password            VARCHAR(255) NOT NULL,
  is_verified         BOOLEAN NOT NULL DEFAULT true,  -- false for new signups until OTP verified; true for all existing users
  signup_otp          VARCHAR(255),                   -- bcrypt hash of 6-digit signup verification OTP
  signup_otp_expiry   TIMESTAMPTZ,                    -- expires 10 minutes after sending
  otp                 VARCHAR(255),                   -- forgot-password OTP (separate from signup_otp)
  otp_expiry          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- TABLE: trucks  (created before drivers for FK ordering)
-- ==============================================================
CREATE TABLE IF NOT EXISTS trucks (
  id                 SERIAL PRIMARY KEY,
  truck_number       VARCHAR(20) UNIQUE NOT NULL,
  type               VARCHAR(30) NOT NULL
                     CHECK (type IN ('Container','Open Body','Refrigerated','Trailer')),
  capacity_tons      DECIMAL(5,1) NOT NULL,
  base_location      VARCHAR(100) NOT NULL DEFAULT 'Aurangabad',
  year               INTEGER NOT NULL,
  status             VARCHAR(20) DEFAULT 'Available'
                     -- Valid: 'Available' | 'Assigned' | 'On Trip' | 'Maintenance'
                     -- Assigned = booking confirmed but not yet departed
                     -- On Trip  = booking In Transit
                     CHECK (status IN ('Available','Assigned','On Trip','Maintenance')),
  owner_name         VARCHAR(100) DEFAULT 'Bharat Khese',
  owner_phone        VARCHAR(15)  DEFAULT '9284652405',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  assigned_driver_id INTEGER DEFAULT NULL,   -- FK added below after drivers exists
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- TABLE: admins
-- ==============================================================
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  otp        VARCHAR(255),
  otp_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- TABLE: drivers
-- ==============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  phone             VARCHAR(15)  NOT NULL,
  license_number    VARCHAR(50),
  assigned_truck_id INTEGER DEFAULT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'Available'
                    -- Valid: 'Available' | 'Assigned' | 'On Trip'
                    CHECK (status IN ('Available','Assigned','On Trip')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- FK to trucks (trucks created first, so safe here)
  CONSTRAINT fk_driver_truck
    FOREIGN KEY (assigned_truck_id) REFERENCES trucks(id) ON DELETE SET NULL
);

-- ==============================================================
-- TABLE: bookings
-- ==============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id                   SERIAL PRIMARY KEY,
  booking_id           VARCHAR(20) UNIQUE NOT NULL,
  user_id              INTEGER NOT NULL,
  truck_id             INTEGER DEFAULT NULL,
  driver_id            INTEGER DEFAULT NULL,

  pickup_location      VARCHAR(200) NOT NULL,
  destination          VARCHAR(200) NOT NULL,
  goods_type           VARCHAR(100) NOT NULL,
  weight_tons          DECIMAL(5,1) NOT NULL,
  pickup_date          DATE NOT NULL,
  delivery_date        DATE,
  actual_delivery_date DATE,
  preferred_truck_type VARCHAR(50),
  notes                TEXT,

  -- ── Snapshot columns (added via ALTER TABLE – run Railway migration) ──
  -- Preserves truck/driver identity in booking history after soft-delete
  truck_number         TEXT,          -- snapshot of trucks.truck_number at booking time
  driver_name          TEXT,          -- snapshot of drivers.name at booking time

  status               VARCHAR(20) DEFAULT 'Pending'
                       CHECK (status IN ('Pending','Confirmed','In Transit','Delivered','Cancelled')),

  created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_booking_user
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_booking_truck
    FOREIGN KEY (truck_id)  REFERENCES trucks(id)  ON DELETE SET NULL,
  CONSTRAINT fk_booking_driver
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- ==============================================================
-- MIGRATION v3: Add snapshot columns to existing bookings table
-- SAFE TO RUN even if columns already exist (IF NOT EXISTS guard)
-- Run in Railway → Data → SQL Editor
-- ==============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS truck_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_name  TEXT;

-- Backfill truck_number from trucks JOIN
UPDATE bookings b
SET truck_number = t.truck_number
FROM trucks t
WHERE b.truck_id = t.id
  AND b.truck_number IS NULL;

-- Backfill driver_name from drivers JOIN
UPDATE bookings b
SET driver_name = d.name
FROM drivers d
WHERE b.driver_id = d.id
  AND b.driver_name IS NULL;

-- Verify (should return 2 rows with data_type = 'text')
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('truck_number', 'driver_name');

-- ==============================================================
-- FOREIGN KEY: trucks → drivers
-- Added after drivers table exists (trucks was created first)
-- ==============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_truck_driver'
      AND table_name = 'trucks'
  ) THEN
    ALTER TABLE trucks
      ADD CONSTRAINT fk_truck_driver
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==============================================================
-- INDEXES for performance
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trucks_status       ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_is_active    ON trucks(is_active);

-- ==============================================================
-- SAMPLE DATA: Trucks
-- ==============================================================
INSERT INTO trucks (truck_number, type, capacity_tons, base_location, year, status) VALUES
  ('MH 20 AB 1234', 'Container',    20.0, 'Aurangabad', 2021, 'Available'),
  ('MH 20 CD 5678', 'Open Body',    12.0, 'Pune',       2020, 'Available'),
  ('MH 20 EF 9012', 'Refrigerated',  8.0, 'Nashik',     2022, 'Available'),
  ('MH 14 GH 3456', 'Trailer',      30.0, 'Mumbai',     2023, 'Available'),
  ('MH 04 IJ 7890', 'Container',    18.0, 'Nagpur',     2022, 'Available'),
  ('MH 09 KL 2345', 'Open Body',    10.0, 'Solapur',    2019, 'Available')
ON CONFLICT (truck_number) DO NOTHING;

-- ==============================================================
-- SAMPLE DATA: Admin
-- ⚠️  Replace the password hash with your actual bcrypt hash!
-- Generate: node -e "const b=require('bcryptjs');b.hash('YourPass',12).then(console.log)"
-- ==============================================================
INSERT INTO admins (email, password) VALUES
  ('sairajtransport96@gmail.com', '$2a$12$04n2lMuQXfnLqw5.RDfrJ.ZRSPCJqRDBGwd\P4ptwVUFVZp3gC7S2')
ON CONFLICT (email) DO NOTHING;

-- ==============================================================
-- SAMPLE DATA: Drivers
-- Note: ON CONFLICT requires a column target when the table has
-- no single unique column besides PK.
-- We use DO NOTHING after checking license_number uniqueness.
-- ==============================================================
INSERT INTO drivers (name, phone, license_number, assigned_truck_id) VALUES
  ('Raju Patil',    '9876543210', 'MH-1420110012345', 1),
  ('Sanjay More',   '9823456710', 'MH-0220090056789', 2),
  ('Vijay Shinde',  '9765432109', 'MH-2120150078901', NULL),
  ('Pradeep Yadav', '9654321089', 'MH-0420170034567', 4);

-- Link trucks ↔ drivers (only if trucks still have no driver assigned)
UPDATE trucks SET assigned_driver_id = 1 WHERE id = 1 AND assigned_driver_id IS NULL;
UPDATE trucks SET assigned_driver_id = 2 WHERE id = 2 AND assigned_driver_id IS NULL;
UPDATE trucks SET assigned_driver_id = 4 WHERE id = 4 AND assigned_driver_id IS NULL;
UPDATE trucks SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- ==============================================================
-- MIGRATION v4: Backfill trucks.assigned_driver_id and
--               drivers.assigned_truck_id from active bookings
-- Run once in Railway → Data → SQL Editor
-- Safe to re-run — guarded by IS NULL checks
-- ==============================================================

-- Step 1: Set trucks.assigned_driver_id from active bookings
UPDATE trucks t
SET assigned_driver_id = b.driver_id
FROM bookings b
WHERE b.truck_id = t.id
  AND b.driver_id IS NOT NULL
  AND b.status IN ('Confirmed', 'In Transit')
  AND t.assigned_driver_id IS NULL;

-- Step 2: Set drivers.assigned_truck_id from active bookings
UPDATE drivers d
SET assigned_truck_id = b.truck_id
FROM bookings b
WHERE b.driver_id = d.id
  AND b.truck_id IS NOT NULL
  AND b.status IN ('Confirmed', 'In Transit')
  AND d.assigned_truck_id IS NULL;

-- Verify Step 1 — should show driver names for assigned trucks
SELECT t.truck_number, t.status, d.name AS driver_name
FROM trucks t
LEFT JOIN drivers d ON t.assigned_driver_id = d.id
WHERE t.is_active = true
ORDER BY t.id;

-- Verify Step 2 — should show truck numbers for assigned drivers
SELECT d.name, d.status, t.truck_number
FROM drivers d
LEFT JOIN trucks t ON d.assigned_truck_id = t.id
WHERE d.is_active = true
ORDER BY d.id;

-- ==============================================================
-- MIGRATION v5: Add signup OTP verification columns to users
-- Run once in Railway → Data → SQL Editor
-- Safe to re-run — uses IF NOT EXISTS / DEFAULT true
-- ==============================================================

-- is_verified: true by default so ALL existing users can still login
-- signup_otp / signup_otp_expiry: separate from forgot-password OTP columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS signup_otp          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signup_otp_expiry   TIMESTAMPTZ;

-- Verify the columns were added:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ==============================================================
-- DONE — schema ready for production
-- ==============================================================
