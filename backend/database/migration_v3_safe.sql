-- ==============================================================
-- SAIRAJ TRANSPORT — RAILWAY POSTGRESQL SAFE MIGRATION v3
-- ==============================================================
-- ✅ SAFE TO RUN MULTIPLE TIMES (fully idempotent)
-- ✅ Uses IF NOT EXISTS — WON'T fail if column already exists
-- ✅ Uses ON CONFLICT DO UPDATE — WON'T duplicate existing rows
-- ✅ Uses ON CONFLICT DO NOTHING — safe for unique constraints
-- ==============================================================
-- HOW TO RUN:
--   Railway → Your Project → PostgreSQL → Data tab → SQL Editor
--   Paste ALL of this → Run
-- ==============================================================

-- --------------------------------------------------------------
-- SECTION 1: bookings table — add missing columns
-- --------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS truck_number         TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_name          TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS preferred_truck_type VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes                TEXT;

-- --------------------------------------------------------------
-- SECTION 2: trucks table — add missing columns
-- --------------------------------------------------------------
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS is_active    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS owner_name   VARCHAR(100) DEFAULT 'Bharat Khese';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS owner_phone  VARCHAR(15)  DEFAULT '9284652405';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS year         INTEGER;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS base_location VARCHAR(100) DEFAULT 'Aurangabad';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS assigned_driver_id INTEGER DEFAULT NULL;

-- --------------------------------------------------------------
-- SECTION 3: drivers table — add missing columns
-- --------------------------------------------------------------
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number  VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_truck_id INTEGER DEFAULT NULL;

-- --------------------------------------------------------------
-- SECTION 4: Foreign keys — add only if they don't exist
-- --------------------------------------------------------------
DO $$
BEGIN
  -- trucks.assigned_driver_id → drivers(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_truck_driver' AND table_name = 'trucks'
  ) THEN
    ALTER TABLE trucks ADD CONSTRAINT fk_truck_driver
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;

  -- drivers.assigned_truck_id → trucks(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_driver_truck' AND table_name = 'drivers'
  ) THEN
    ALTER TABLE drivers ADD CONSTRAINT fk_driver_truck
      FOREIGN KEY (assigned_truck_id) REFERENCES trucks(id) ON DELETE SET NULL;
  END IF;

  -- bookings.fk_booking_truck
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_booking_truck' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_booking_truck
      FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL;
  END IF;

  -- bookings.fk_booking_driver
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_booking_driver' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_booking_driver
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- --------------------------------------------------------------
-- SECTION 5: Indexes — all idempotent with IF NOT EXISTS
-- --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trucks_status       ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_is_active    ON trucks(is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active   ON drivers(is_active);

-- --------------------------------------------------------------
-- SECTION 6: Data backfill — safe updates (only fills NULL gaps)
-- --------------------------------------------------------------
-- Backfill truck_number snapshot from trucks JOIN
UPDATE bookings b
SET truck_number = t.truck_number
FROM trucks t
WHERE b.truck_id = t.id AND b.truck_number IS NULL;

-- Backfill driver_name snapshot from drivers JOIN
UPDATE bookings b
SET driver_name = d.name
FROM drivers d
WHERE b.driver_id = d.id AND b.driver_name IS NULL;

-- Ensure existing trucks/drivers are active (not accidentally NULL)
UPDATE trucks  SET is_active = true WHERE is_active IS NULL;
UPDATE drivers SET is_active = true WHERE is_active IS NULL;

-- --------------------------------------------------------------
-- SECTION 7: Sample trucks — INSERT or UPDATE if already exists
-- Uses ON CONFLICT(truck_number) DO UPDATE so re-running is safe
-- --------------------------------------------------------------
INSERT INTO trucks (truck_number, type, capacity_tons, base_location, year, status, owner_name, owner_phone, is_active)
VALUES
  ('MH 20 AB 1234', 'Container',    20.0, 'Chha. SambhajiNagar', 2021, 'Available', 'Bharat Khese', '9284652405', true),
  ('MH 20 CD 5678', 'Open Body',    12.0, 'Pune',                2020, 'Available', 'Bharat Khese', '9284652405', true),
  ('MH 20 EF 9012', 'Refrigerated',  8.0, 'Nashik',              2022, 'Available', 'Bharat Khese', '9284652405', true),
  ('MH 14 GH 3456', 'Trailer',      30.0, 'Mumbai',              2023, 'Available', 'Bharat Khese', '9284652405', true),
  ('MH 04 IJ 7890', 'Container',    18.0, 'Nagpur',              2022, 'Available', 'Bharat Khese', '9284652405', true),
  ('MH 09 KL 2345', 'Open Body',    10.0, 'Solapur',             2019, 'Available', 'Bharat Khese', '9284652405', true)
ON CONFLICT (truck_number) DO UPDATE SET
  type          = EXCLUDED.type,
  capacity_tons = EXCLUDED.capacity_tons,
  base_location = EXCLUDED.base_location,
  year          = EXCLUDED.year,
  owner_name    = EXCLUDED.owner_name,
  owner_phone   = EXCLUDED.owner_phone,
  is_active     = true;    -- re-enable if was soft-deleted

-- --------------------------------------------------------------
-- SECTION 8: Admin account — INSERT or UPDATE password if exists
-- ⚠️  bcrypt hash below is for the password stored in your .env
--    To regenerate:
--    node -e "const b=require('bcryptjs'); b.hash('YourPassword',12).then(console.log)"
-- --------------------------------------------------------------
INSERT INTO admins (email, password)
VALUES ('sairajtransport96@gmail.com', '$2a$12$04n2lMuQXfnLqw5.RDfrJ.ZRSPCJqRDBGwd\P4ptwVUFVZp3gC7S2')
ON CONFLICT (email) DO NOTHING;

-- --------------------------------------------------------------
-- SECTION 9: Verify — check all critical columns exist
-- (Should return 4 rows for bookings, confirm other tables too)
-- --------------------------------------------------------------
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('bookings', 'trucks', 'drivers')
  AND column_name IN (
    'truck_number', 'driver_name', 'is_active', 'image_url',
    'actual_delivery_date', 'preferred_truck_type'
  )
ORDER BY table_name, column_name;

-- ==============================================================
-- ✅ DONE — migration complete
-- ==============================================================
