// ============================================================
// controllers/bookingController.js – Booking Logic (Secured)
// ============================================================

const Booking = require("../models/Booking");
const User = require("../models/User");
const { getIO } = require("../config/socketIO");
const transporter = require("../config/mailer");
const { bookingReceivedEmail, adminNewBookingEmail } = require("../config/emailTemplates");

// ── POST /api/book ───────────────────────────────────────────
// userId is read from req.user (JWT) — NOT from req.body
const createBooking = async (req, res) => {
  try {
    const userId = req.user.userId; // injected by verifyUser middleware

    const {
      pickupLocation,
      destination,
      goodsType,
      weight,
      pickupDate,
      deliveryDate,
      truckType,
      notes,
    } = req.body;

    if (
      !pickupLocation ||
      !destination ||
      !goodsType ||
      !weight ||
      !pickupDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "pickupLocation, destination, goodsType, weight, and pickupDate are required.",
      });
    }

    // Weight sanity check
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 40) {
      return res.status(400).json({
        success: false,
        message: "Weight must be between 0.5 and 40 tons.",
      });
    }

    // Delivery date must not be before pickup date
    if (
      deliveryDate &&
      pickupDate &&
      new Date(deliveryDate) < new Date(pickupDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Expected delivery date must be on or after the pickup date.",
      });
    }

    const { insertId, bookingId } = await Booking.create({
      userId,
      pickupLocation,
      destination,
      goodsType,
      weight: weightNum,
      pickupDate,
      deliveryDate: deliveryDate || null,
      preferredTruckType: truckType || null,
      notes: notes || null,
    });

    // ── Socket: notify user room + broadcast so admin panel refreshes ─
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit("bookingCreated", { bookingId, status: "Pending" });
      io.to("adminRoom").emit("bookingCreated", { bookingId, status: "Pending" });
    } catch (_) { /* socket not ready */ }

    // ── Emails: fire-and-forget (non-blocking — does not delay response) ─
    ;(async () => {
      try {
        const userObj  = await User.findById(userId);
        const userEmail = req.user.email;
        // Booking received confirmation → user
        await transporter.sendMail(
          bookingReceivedEmail(userEmail, bookingId, pickupLocation, destination, goodsType)
        );
        console.log(`📧 Booking received email sent to ${userEmail} for ${bookingId}`);
        // New booking alert → admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await transporter.sendMail(
            adminNewBookingEmail(
              adminEmail, bookingId, pickupLocation, destination, goodsType,
              userObj?.name || "", userObj?.phone || ""
            )
          );
          console.log(`📧 Admin alert email sent to ${adminEmail} for ${bookingId}`);
        }
      } catch (emailErr) {
        console.error("Booking email error (non-fatal):", emailErr.message);
      }
    })();

    res.status(201).json({
      success: true,
      message:
        "Booking submitted successfully! The transport owner will contact you for pricing.",
      data: { id: insertId, bookingId, status: "Pending" },
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to create booking." });
  }
};

// ── GET /api/user-bookings/:userId ───────────────────────────
// LEGACY — kept for backward compatibility; checks ownership via token
const getUserBookings = async (req, res) => {
  try {
    const tokenUserId = req.user.userId.toString();
    const paramUserId = req.params.userId.toString();

    // Prevent fetching another user's bookings
    if (tokenUserId !== paramUserId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const bookings = await Booking.getByUserId(tokenUserId);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("Get Bookings Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
};

// ── GET /api/bookings/user ───────────────────────────────────
// Email is read from JWT (req.user.email) — NOT from URL
const getBookingsByEmail = async (req, res) => {
  try {
    const email = req.user.email;
    const bookings = await Booking.getByEmail(email);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("Get Bookings By Email Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
};

// ── GET /api/booking/:bookingId ──────────────────────────────
// Ownership check: booking must belong to the logged-in user
const getSingleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByBookingId(bookingId.toUpperCase());

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // Verify ownership
    if (booking.user_id.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Get Single Booking Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking." });
  }
};

// ── PUT /api/bookings/:bookingId ─────────────────────────────
// User can update ONLY their own Pending booking
const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      pickup_location,
      destination,
      goods_type,
      weight_tons,
      pickup_date,
      delivery_date,
      notes,
    } = req.body;

    const existing = await Booking.findByBookingId(bookingId.toUpperCase());

    // ✅ Guard: booking must exist before accessing its properties
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Ownership check
    if (existing.user_id.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    if (existing.status !== "Pending") {
      return res.status(403).json({
        success: false,
        message: `Booking cannot be edited after confirmation. Current status: ${existing.status}.`,
      });
    }

    if (
      delivery_date &&
      pickup_date &&
      new Date(delivery_date) < new Date(pickup_date)
    ) {
      return res.status(400).json({
        success: false,
        message: "Expected delivery date must be on or after the pickup date.",
      });
    }

    const updated = await Booking.updateByUser(bookingId.toUpperCase(), {
      pickup_location,
      destination,
      goods_type,
      weight_tons:
        weight_tons !== undefined ? parseFloat(weight_tons) : undefined,
      pickup_date,
      delivery_date: delivery_date || null,
      notes,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or could not be updated.",
      });
    }
    try {
      const io = getIO();
      io.to(`user_${existing.user_id}`).emit("bookingUpdated", { bookingId, status: "Updated" });
    } catch (_) { /* socket not ready */ }
  
    res.json({ success: true, message: "Booking updated successfully." });
  } catch (error) {
    console.error("Update Booking Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update booking." });
  }
};

// ── GET /api/bookings/:bookingId/report ──────────────────────
const getBookingReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByBookingId(bookingId.toUpperCase());

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // Ownership check
    if (booking.user_id.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    if (booking.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Report is only available for Delivered bookings.",
      });
    }

    res.json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        customer_name: booking.user_name || "N/A",
        customer_phone: booking.user_phone || "N/A",
        goods_type: booking.goods_type,
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        weight_tons: booking.weight_tons,
        pickup_date: booking.pickup_date,
        delivery_date:   booking.actual_delivery_date || booking.delivery_date || null,
        status: booking.status,
        truck_number: booking.truck_number || "N/A",
        truck_type: booking.truck_type || "N/A",
        notes: booking.notes || "",
        company_name: "Sairaj Transport",
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Report Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report." });
  }
};

// ── GET /api/track/:bookingId ────────────────────────────────
// Public — no auth required
const trackBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByBookingId(bookingId.toUpperCase());
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking ID "${bookingId}" not found. Please check and try again.`,
      });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Track Booking Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to track shipment." });
  }
};

// ── GET /api/stats ───────────────────────────────────────────
// Public homepage stats
const getPublicStats = async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM trucks)                               AS "totalTrucks",
        (SELECT COUNT(*) FROM trucks WHERE status = 'Available')   AS "availableTrucks",
        (SELECT COUNT(*) FROM bookings WHERE status = 'Delivered') AS "totalDelivered",
        (SELECT COUNT(*) FROM bookings)                            AS "totalBookings"
    `);
    const stats = rows[0];
    // Normalise PostgreSQL count strings to numbers
    const data = {
      totalTrucks:     parseInt(stats.totalTrucks, 10),
      availableTrucks: parseInt(stats.availableTrucks, 10),
      totalDelivered:  parseInt(stats.totalDelivered, 10),
      totalBookings:   parseInt(stats.totalBookings, 10),
    };
    res.json({ success: true, data });
  } catch (err) {
    console.error("Public Stats Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingsByEmail,
  getSingleBooking,
  updateBooking,
  getBookingReport,
  trackBooking,
  getPublicStats,
};
