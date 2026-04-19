// ============================================================
// routes/bookingRoutes.js – Secured Booking Routes
// ============================================================

const express = require("express");
const router = express.Router();
const verifyUser = require("../middleware/userAuth");

const {
  createBooking,
  getUserBookings,
  getBookingsByEmail,
  getSingleBooking,
  updateBooking,
  getBookingReport,
  trackBooking,
  getPublicStats,
} = require("../controllers/bookingController");

// ── 🌐 FULLY PUBLIC (no auth required) ──────────────────────
// Tracking is public so anyone with a booking ID can track
router.get("/track/:bookingId", trackBooking);

// Public homepage stats widget
router.get("/stats", getPublicStats);

// ── 🔒 PROTECTED (user JWT required) ────────────────────────
// Create a new booking — userId comes from req.user in controller
router.post("/book", verifyUser, createBooking);

// Get bookings for the logged-in user (from token, not URL param)
router.get("/user", verifyUser, getBookingsByEmail);

// Get a single booking (ownership verified in controller)
router.get("/:bookingId", verifyUser, getSingleBooking);

// Edit a booking (Pending only, ownership verified in controller)
router.put("/:bookingId", verifyUser, updateBooking);

// Download report for a delivered booking
router.get("/:bookingId/report", verifyUser, getBookingReport);

// ── LEGACY ROUTE (kept for backward compatibility) ───────────
// Deprecated: use /bookings/user instead. Will be removed in v2.
router.get("/user-bookings/:userId", verifyUser, getUserBookings);

module.exports = router;
