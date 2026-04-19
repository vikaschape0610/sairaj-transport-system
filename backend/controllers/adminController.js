// ============================================================
// controllers/adminController.js – Admin Panel Logic (PostgreSQL)
// ============================================================

const { sendAdminOTP } = require("../config/adminMail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const Admin = require("../models/Admin");
const { getIO } = require("../config/socketIO");
const transporter = require("../config/mailer");
const { bookingConfirmedEmail, bookingDeliveredEmail } = require("../config/emailTemplates");

// JWT_SECRET must exist — server.js guards against missing env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "24h";

// ── Validation helpers ────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (v) => EMAIL_RE.test((v || "").trim());

// ── POST /api/admin/login ────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }
    if (!isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const admin = await Admin.findByEmail(email.trim().toLowerCase());
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    res.json({
      success: true,
      message: "Admin login successful!",
      token,
      admin: { id: admin.id, email: admin.email },
    });
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── POST /api/admin/send-otp ──────────────────────────────────
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }
    if (!isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const [rows] = await db.execute(
      "SELECT * FROM admins WHERE email = $1",
      [email.trim().toLowerCase()],
    );
    const admin = rows[0];

    if (!admin) {
      return res.json({
        success: true,
        message: "If this email is registered, an OTP has been sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otpHash = await bcrypt.hash(otp, 8);

    await db.execute(
      "UPDATE admins SET otp = $1, otp_expiry = $2 WHERE email = $3",
      [otpHash, expiry, email.trim().toLowerCase()],
    );

    await sendAdminOTP(email.trim(), otp);

    res.json({
      success: true,
      message: "If this email is registered, an OTP has been sent.",
    });
  } catch (err) {
    console.error("Admin Send OTP Error:", err.message);
    res.status(500).json({ success: false, message: "Error sending OTP." });
  }
};

// ── POST /api/admin/reset-password ────────────────────────────
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }
    if (!isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ success: false, message: "OTP must be a 6-digit number." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const [rows] = await db.execute(
      "SELECT * FROM admins WHERE email = $1",
      [email.trim().toLowerCase()],
    );
    const admin = rows[0];

    if (!admin || !admin.otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }
    if (new Date(admin.otp_expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const isMatch = await bcrypt.compare(otp, admin.otp);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect OTP." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await db.execute(
      "UPDATE admins SET password = $1, otp = NULL, otp_expiry = NULL WHERE email = $2",
      [hashed, email.trim().toLowerCase()],
    );

    res.json({ success: true, message: "Admin password reset successful." });
  } catch (err) {
    console.error("Admin Reset Password Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/dashboard ─────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [statsRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM bookings)                                                    AS "totalBookings",
        (SELECT COUNT(*) FROM trucks)                                                      AS "totalTrucks",
        (SELECT COUNT(*) FROM drivers)                                                     AS "totalDrivers",
        (SELECT COUNT(*) FROM bookings WHERE status = 'Pending')                          AS "pendingBookings",
        (SELECT COUNT(*) FROM bookings WHERE status = 'In Transit')                       AS "inTransitCount",
        (SELECT COUNT(*) FROM bookings WHERE status = 'Delivered')                        AS "deliveredCount",
        (SELECT COUNT(*) FROM trucks WHERE status = 'Available')                          AS "availableTrucks",
        (SELECT COUNT(*) FROM trucks WHERE status = 'Maintenance')                        AS "maintenanceTrucks"
    `);
    const stats = statsRows[0];

    const [recentBookings] = await db.execute(
      `SELECT b.booking_id, b.goods_type, b.pickup_location, b.destination,
              b.status, b.created_at, u.name AS user_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC
       LIMIT 10`,
    );

    // PostgreSQL returns counts as strings — normalise to numbers
    const normalised = {};
    for (const [k, v] of Object.entries(stats)) {
      normalised[k] = typeof v === "string" ? parseInt(v, 10) : v;
    }

    res.json({ success: true, data: { ...normalised, recentBookings } });
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/bookings ──────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
  b.id, b.booking_id, b.user_id, b.truck_id, b.driver_id,
  b.pickup_location, b.destination, b.goods_type, b.weight_tons,
  b.pickup_date, b.delivery_date, b.actual_delivery_date,
  b.preferred_truck_type, b.notes, b.status, b.created_at,
  u.name  AS user_name,
  u.phone AS user_phone,
  u.email AS user_email,
  t.truck_number AS truck_number,
  t.type         AS truck_type,
  d.name         AS driver_name,
  d.phone        AS driver_phone,
  CASE
    WHEN b.status = 'Delivered' THEN b.actual_delivery_date
    ELSE b.delivery_date
  END AS final_delivery_date
FROM bookings b
LEFT JOIN users   u ON b.user_id   = u.id
LEFT JOIN trucks  t ON b.truck_id  = t.id
LEFT JOIN drivers d ON b.driver_id = d.id
ORDER BY b.created_at DESC`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get All Bookings Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── PUT /api/admin/bookings/:id/status ───────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, truck_id, driver_id } = req.body;

    if (truck_id !== undefined && truck_id !== null && truck_id !== "") {
      const [truckRows] = await db.execute(
        "SELECT id FROM trucks WHERE id = $1",
        [truck_id],
      );
      if (!truckRows[0])
        return res
          .status(400)
          .json({ success: false, message: "Invalid truck ID." });
    }
    if (driver_id !== undefined && driver_id !== null && driver_id !== "") {
      const [driverRows] = await db.execute(
        "SELECT id FROM drivers WHERE id = $1",
        [driver_id],
      );
      if (!driverRows[0])
        return res
          .status(400)
          .json({ success: false, message: "Invalid driver ID." });
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "In Transit",
      "Delivered",
      "Cancelled",
    ];
    if (status && !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }

    const [bookingRows] = await db.execute(
      `SELECT b.booking_id, b.user_id, b.truck_id, b.driver_id,
              u.email AS user_email, u.name AS user_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.booking_id = $1`,
      [id],
    );
    const booking = bookingRows[0];
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (status !== undefined) {
      fields.push(`status = $${paramIdx++}`);
      values.push(status);
    }
    if (status === "Delivered") {
      fields.push(`actual_delivery_date = $${paramIdx++}`);
      values.push(new Date());
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "truck_id")) {
      fields.push(`truck_id = $${paramIdx++}`);
      values.push(truck_id ?? null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "driver_id")) {
      fields.push(`driver_id = $${paramIdx++}`);
      values.push(driver_id ?? null);
    }
    if (fields.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update." });

    values.push(id);
    await db.execute(
      `UPDATE bookings SET ${fields.join(", ")} WHERE booking_id = $${paramIdx}`,
      values,
    );

    // ── Determine effective truck/driver IDs (declared OUTSIDE if-block for snapshot access) ──
    const effectiveTruckId  = Object.prototype.hasOwnProperty.call(req.body, "truck_id")
      ? (truck_id  ?? null) : booking.truck_id;
    const effectiveDriverId = Object.prototype.hasOwnProperty.call(req.body, "driver_id")
      ? (driver_id ?? null) : booking.driver_id;

    // ── Release OLD truck/driver if being REPLACED by a different one ─
    // This prevents "ghost assigned" status when admin reassigns a booking
    if (Object.prototype.hasOwnProperty.call(req.body, "truck_id")) {
      const oldTruckId = booking.truck_id;
      const newTruckId = truck_id ?? null;
      if (oldTruckId && newTruckId !== null && String(oldTruckId) !== String(newTruckId)) {
        await db.execute("UPDATE trucks SET status = 'Available' WHERE id = $1", [oldTruckId]);
        console.log(`🔓 Released old truck ${oldTruckId} → Available (replaced by ${newTruckId})`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "driver_id")) {
      const oldDriverId = booking.driver_id;
      const newDriverId = driver_id ?? null;
      if (oldDriverId && newDriverId !== null && String(oldDriverId) !== String(newDriverId)) {
        await db.execute("UPDATE drivers SET status = 'Available' WHERE id = $1", [oldDriverId]);
        console.log(`🔓 Released old driver ${oldDriverId} → Available (replaced by ${newDriverId})`);
      }
    }

    // ── Sync truck & driver status based on booking status ───────────────
    const statusResourceMap = {
      Confirmed:    "Assigned",
      "In Transit": "On Trip",
      Delivered:    "Available",
      Cancelled:    "Available",
    };
    if (status && statusResourceMap[status]) {
      const newResourceStatus = statusResourceMap[status];
      if (effectiveTruckId)
        await db.execute("UPDATE trucks  SET status = $1 WHERE id = $2", [newResourceStatus, effectiveTruckId]);
      if (effectiveDriverId)
        await db.execute("UPDATE drivers SET status = $1 WHERE id = $2", [newResourceStatus, effectiveDriverId]);

      // ── On Delivered/Cancelled: clear assigned_driver_id on truck and assigned_truck_id on driver ──
      if (newResourceStatus === "Available") {
        if (effectiveTruckId)
          await db.execute("UPDATE trucks SET assigned_driver_id = NULL WHERE id = $1", [effectiveTruckId]);
        if (effectiveDriverId)
          await db.execute("UPDATE drivers SET assigned_truck_id = NULL WHERE id = $1", [effectiveDriverId]);
      }
    }

    // ── When assigning truck+driver: sync trucks.assigned_driver_id and drivers.assigned_truck_id ──
    // This ensures the Trucks page shows driver name and Drivers page shows truck number
    if (Object.prototype.hasOwnProperty.call(req.body, "truck_id") || Object.prototype.hasOwnProperty.call(req.body, "driver_id")) {
      // Only sync the cross-link if we are assigning (not clearing/delivering)
      const isAssigning = effectiveTruckId && effectiveDriverId;
      if (isAssigning) {
        // Set trucks.assigned_driver_id = effectiveDriverId for the assigned truck
        await db.execute("UPDATE trucks SET assigned_driver_id = $1 WHERE id = $2", [effectiveDriverId, effectiveTruckId]);
        // Set drivers.assigned_truck_id = effectiveTruckId for the assigned driver
        await db.execute("UPDATE drivers SET assigned_truck_id = $1 WHERE id = $2", [effectiveTruckId, effectiveDriverId]);
        console.log(`🔗 Synced: truck ${effectiveTruckId} ↔ driver ${effectiveDriverId}`);
      }
    }


    // ── Snapshot: save truck_number + driver_name into booking row ─
    // ✅ CRITICAL: effectiveTruckId/effectiveDriverId now in scope — snapshot always saves
    // Protects booking history if truck/driver is later soft-deleted
    try {
      const snapFields = []; const snapVals = []; let si = 1;
      if (effectiveTruckId) {
        const [ts] = await db.execute("SELECT truck_number FROM trucks WHERE id = $1", [effectiveTruckId]);
        if (ts[0]?.truck_number) { snapFields.push(`truck_number = $${si++}`); snapVals.push(ts[0].truck_number); }
      }
      if (effectiveDriverId) {
        const [ds] = await db.execute("SELECT name FROM drivers WHERE id = $1", [effectiveDriverId]);
        if (ds[0]?.name) { snapFields.push(`driver_name = $${si++}`); snapVals.push(ds[0].name); }
      }
      if (snapFields.length > 0) {
        snapVals.push(id);
        await db.execute(`UPDATE bookings SET ${snapFields.join(', ')} WHERE booking_id = $${si}`, snapVals);
        console.log(`📌 Snapshot saved for booking ${id}: truck=${snapVals[0] || '—'} driver=${snapVals[1] || '—'}`);
      }
    } catch (snapErr) { console.error("Snapshot save error (non-fatal):", snapErr.message); }

    // ── Socket broadcast to all connected clients (users + admin) ─
    try {
      const io = getIO();
      io.emit("bookingUpdated", { bookingId: id, status });
    } catch (_) { /* socket not ready */ }

    // ── Email notifications — fire-and-forget (non-blocking) ──────
    if (status && booking.user_email) {
      ;(async () => {
        try {
          if (status === "Confirmed") {
            await transporter.sendMail(
              bookingConfirmedEmail(booking.user_email, booking.user_name, id)
            );
            console.log(`📧 Confirmation email sent to ${booking.user_email} for ${id}`);
          } else if (status === "Delivered") {
            await transporter.sendMail(
              bookingDeliveredEmail(booking.user_email, booking.user_name, id)
            );
            console.log(`📧 Delivery email sent to ${booking.user_email} for ${id}`);
          }
        } catch (emailErr) {
          console.error("Status email error (non-fatal):", emailErr.message);
        }
      })();
    }

    res.json({ success: true, message: "Booking updated successfully." });
  } catch (err) {
    console.error("Update Booking Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/trucks ────────────────────────────────────
const getAllTrucks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.*,
              d.name AS assigned_driver_name,
              d.phone AS assigned_driver_phone
       FROM trucks t
       LEFT JOIN drivers d ON t.assigned_driver_id = d.id
       WHERE t.is_active = true
       ORDER BY t.id ASC`,
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Get Trucks Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getUnassignedTrucks = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM trucks
      WHERE status = 'Available'
      AND id NOT IN (
        SELECT truck_id FROM bookings
        WHERE status IN ('Confirmed', 'In Transit')
        AND truck_id IS NOT NULL
      )
      ORDER BY id ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get Unassigned Trucks Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getAvailableDrivers = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM drivers
      WHERE id NOT IN (
        SELECT driver_id FROM bookings
        WHERE status IN ('Confirmed', 'In Transit')
        AND driver_id IS NOT NULL
      )
      ORDER BY id ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get Available Drivers Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const addTruck = async (req, res) => {
  try {
    const {
      truck_number,
      type,
      capacity_tons,
      base_location,
      year,
      owner_name,
      owner_phone,
      status,
    } = req.body;
    if (!truck_number || !type || !capacity_tons || capacity_tons <= 0) {
      return res.status(400).json({
        success: false,
        message: "truck_number, type, and capacity_tons are required.",
      });
    }
    // ── Convert image to base64 Data URL (stored in DB, survives Render restarts) ──
    const imageUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : null;

    // ── Build INSERT dynamically (skip image_url if no file uploaded) ──
    // This prevents 500 errors if image_url column doesn't exist yet in DB
    const cols = [
      "truck_number", "type", "capacity_tons", "base_location",
      "year", "owner_name", "owner_phone", "status", "is_active",
    ];
    const vals = [
      truck_number, type, parseFloat(capacity_tons),
      base_location || "Chha. SambhajiNagar",
      year || new Date().getFullYear(),
      owner_name || "Bharat Khese",
      owner_phone || "9284652405",
      status || "Available",
      true,
    ];
    if (imageUrl) { cols.push("image_url"); vals.push(imageUrl); }

    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    const [rows] = await db.execute(
      `INSERT INTO trucks (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      vals,
    );
    const newTruck = rows[0];
    res.status(201).json({ success: true, message: "Truck added successfully.", data: newTruck });
    try { const io = getIO(); io.emit("truckUpdated"); } catch (_) {}

  } catch (err) {
    // PostgreSQL unique constraint violation code: 23505
    if (err.code === "23505")
      return res
        .status(409)
        .json({ success: false, message: "Truck number already exists." });
    console.error("Add Truck Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      truck_number,
      type,
      capacity_tons,
      base_location,
      year,
      owner_name,
      owner_phone,
      status,
      assigned_driver_id,
    } = req.body;

    const [truckCheck] = await db.execute(
      "SELECT id FROM trucks WHERE id = $1",
      [id],
    );
    if (!truckCheck[0])
      return res
        .status(404)
        .json({ success: false, message: "Truck not found." });

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (truck_number !== undefined) {
      fields.push(`truck_number = $${paramIdx++}`);
      values.push(truck_number);
    }
    if (type !== undefined) {
      fields.push(`type = $${paramIdx++}`);
      values.push(type);
    }
    if (capacity_tons !== undefined) {
      fields.push(`capacity_tons = $${paramIdx++}`);
      values.push(parseFloat(capacity_tons) || 0);
    }
    if (base_location !== undefined) {
      fields.push(`base_location = $${paramIdx++}`);
      values.push(base_location || null);
    }
    if (year !== undefined) {
      fields.push(`year = $${paramIdx++}`);
      values.push(year || null);
    }
    if (owner_name !== undefined) {
      fields.push(`owner_name = $${paramIdx++}`);
      values.push(owner_name || null);
    }
    if (owner_phone !== undefined) {
      fields.push(`owner_phone = $${paramIdx++}`);
      values.push(owner_phone || null);
    }
    if (status !== undefined) {
      fields.push(`status = $${paramIdx++}`);
      values.push(status);
    }
    if (assigned_driver_id !== undefined) {
      fields.push(`assigned_driver_id = $${paramIdx++}`);
      values.push(assigned_driver_id || null);
    }
    // ── Image: convert buffer to base64 Data URL if new file uploaded ──
    if (req.file) {
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      fields.push(`image_url = $${paramIdx++}`);
      values.push(dataUrl);
    }
    if (fields.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update." });

    values.push(id);
    const [updatedRows] = await db.execute(
      `UPDATE trucks SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values,
    );
    // Notify frontend of truck list change
    try { const io = getIO(); io.emit("truckUpdated"); } catch (_) {}
    res.json({ success: true, message: "Truck updated successfully.", data: updatedRows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res
        .status(409)
        .json({ success: false, message: "Truck number already in use." });
    console.error("Update Truck Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.execute("SELECT id FROM trucks WHERE id = $1 AND is_active = true", [id]);
    if (!check[0]) return res.status(404).json({ success: false, message: "Truck not found." });
    // ✅ SOFT DELETE — preserve booking history
    await db.execute("UPDATE drivers SET assigned_truck_id = NULL WHERE assigned_truck_id = $1", [id]);
    await db.execute("UPDATE trucks SET is_active = false WHERE id = $1", [id]);
    res.json({ success: true, message: "Truck removed successfully." });
    try { const io = getIO(); io.emit("truckUpdated"); } catch (_) {}
  } catch (err) {
    console.error("Delete Truck Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT d.*, t.truck_number AS assigned_truck_number
       FROM drivers d
       LEFT JOIN trucks t ON d.assigned_truck_id = t.id
       WHERE d.is_active = true
       ORDER BY d.id ASC`,
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Get Drivers Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const addDriver = async (req, res) => {
  try {
    const { name, phone, license_number, assigned_truck_id } = req.body;
    if (!name || !phone)
      return res
        .status(400)
        .json({ success: false, message: "Name and phone are required." });
    if (!/^\d{10}$/.test(phone))
      return res
        .status(400)
        .json({ success: false, message: "Phone must be 10 digits." });

    const [rows] = await db.execute(
      "INSERT INTO drivers (name, phone, license_number, assigned_truck_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, phone, license_number || null, assigned_truck_id || null],
    );
    const newDriverId = rows[0].id;

    if (assigned_truck_id) {
      await db.execute(
        "UPDATE trucks SET assigned_driver_id = $1 WHERE id = $2",
        [newDriverId, assigned_truck_id],
      );
    }
    res.status(201).json({
      success: true,
      message: "Driver added successfully.",
      id: newDriverId,
    });
  } catch (err) {
    console.error("Add Driver Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, license_number, assigned_truck_id } = req.body;

    const [driverCheck] = await db.execute(
      "SELECT id, assigned_truck_id AS old_truck_id FROM drivers WHERE id = $1",
      [id],
    );
    const driver = driverCheck[0];
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found." });

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(name || null);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${paramIdx++}`);
      values.push(phone || null);
    }
    if (license_number !== undefined) {
      fields.push(`license_number = $${paramIdx++}`);
      values.push(license_number || null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "assigned_truck_id")) {
      const newTruckId = assigned_truck_id || null;
      fields.push(`assigned_truck_id = $${paramIdx++}`);
      values.push(newTruckId);
      if (driver.old_truck_id && driver.old_truck_id != newTruckId) {
        await db.execute(
          "UPDATE trucks SET assigned_driver_id = NULL WHERE id = $1 AND assigned_driver_id = $2",
          [driver.old_truck_id, id],
        );
      }
      if (newTruckId) {
        await db.execute(
          "UPDATE trucks SET assigned_driver_id = $1 WHERE id = $2",
          [id, newTruckId],
        );
      }
    }
    if (fields.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update." });

    values.push(id);
    await db.execute(
      `UPDATE drivers SET ${fields.join(", ")} WHERE id = $${paramIdx}`,
      values,
    );
    res.json({ success: true, message: "Driver updated successfully." });
  } catch (err) {
    console.error("Update Driver Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.execute("SELECT id FROM drivers WHERE id = $1 AND is_active = true", [id]);
    if (!check[0]) return res.status(404).json({ success: false, message: "Driver not found." });
    // ✅ SOFT DELETE — unassign from truck but keep booking history intact
    await db.execute("UPDATE trucks SET assigned_driver_id = NULL WHERE assigned_driver_id = $1", [id]);
    await db.execute("UPDATE drivers SET is_active = false WHERE id = $1", [id]);
    res.json({ success: true, message: "Driver removed successfully." });
  } catch (err) {
    console.error("Delete Driver Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const [bookingRows] = await db.execute(
      "SELECT booking_id, user_id FROM bookings WHERE booking_id = $1",
      [id],
    );
    const booking = bookingRows[0];

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    await db.execute("DELETE FROM bookings WHERE booking_id = $1", [id]);

    // PostgreSQL sequences auto-manage IDs — no need to reset AUTO_INCREMENT

    // Broadcast to all so admin panel and user panel both refresh
    try {
      const io = getIO();
      io.emit("bookingDeleted", { bookingId: id });
    } catch (_) { /* socket not ready */ }

    res.json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (err) {
    console.error("Delete Booking Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const getReports = async (req, res) => {
  try {
    // Status count — PostgreSQL doesn't have FIELD(), use CASE for ordering
    const [byStatus] = await db.execute(`
      SELECT status, COUNT(*) AS count
      FROM bookings
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'Pending'    THEN 1
          WHEN 'Confirmed'  THEN 2
          WHEN 'In Transit' THEN 3
          WHEN 'Delivered'  THEN 4
          WHEN 'Cancelled'  THEN 5
          ELSE 6
        END
    `);

    // Monthly count — TO_CHAR() replaces DATE_FORMAT()
    // ⚠️ PostgreSQL: cannot GROUP BY column alias — must repeat expression
    const [monthly] = await db.execute(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS total
      FROM bookings
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC
      LIMIT 6
    `);

    const [topRoutes] = await db.execute(`
      SELECT pickup_location, destination, COUNT(*) AS total
      FROM bookings
      GROUP BY pickup_location, destination
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        byStatus:  byStatus.map((r)  => ({ ...r, count: parseInt(r.count, 10) })),
        monthly:   monthly.map((r)   => ({ ...r, total: parseInt(r.total, 10) })),
        topRoutes: topRoutes.map((r) => ({ ...r, total: parseInt(r.total, 10) })),
      },
    });
  } catch (err) {
    console.error("Reports Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/admin/reports/bookings (FULL REPORT DATA) ─────────
const getAllBookingsReport = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.booking_id,
        b.pickup_location,
        b.destination,
        b.goods_type,
        b.weight_tons,
        b.pickup_date,

        CASE
          WHEN b.status = 'Delivered' THEN b.actual_delivery_date
          ELSE b.delivery_date
        END AS delivery_date,

        b.status,
        b.notes,

        u.name         AS customer_name,
        t.truck_number AS truck_number,
        d.name         AS driver_name

      FROM bookings b
      LEFT JOIN users   u ON b.user_id   = u.id
      LEFT JOIN trucks  t ON b.truck_id  = t.id
      LEFT JOIN drivers d ON b.driver_id = d.id

      ORDER BY b.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Report Bookings Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  adminLogin,
  sendResetOTP,
  resetPasswordWithOTP,
  getDashboard,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getAllTrucks,
  getUnassignedTrucks,
  addTruck,
  updateTruck,
  deleteTruck,
  getAllDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  getReports,
  getAvailableDrivers,
  getAllBookingsReport,
};
