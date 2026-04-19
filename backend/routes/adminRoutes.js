// ============================================================
// routes/adminRoutes.js – Admin Panel Routes (Secured)
// ============================================================

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { verifyAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");
const upload = require("../middleware/upload");

// ── Rate limiters for public admin auth endpoints ─────────────

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

const adminOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 15 minutes.",
  },
});

const adminResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many reset attempts. Please wait 15 minutes.",
  },
});

// ── 🟢 PUBLIC ROUTES (no auth required) ──────────────────────
router.post("/login", adminLoginLimiter, adminController.adminLogin);
router.post("/send-otp", adminOtpLimiter, adminController.sendResetOTP);
router.post(
  "/reset-password",
  adminResetLimiter,
  adminController.resetPasswordWithOTP,
);

// ── 🔒 PROTECTED ROUTES (admin JWT required) ──────────────────
router.use(verifyAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Bookings
router.get("/bookings", adminController.getAllBookings);
router.put("/bookings/:id", adminController.updateBookingStatus);
router.delete("/bookings/:id", adminController.deleteBooking);

// Trucks
router.get("/trucks/unassigned", adminController.getUnassignedTrucks);
router.get("/trucks", adminController.getAllTrucks);
router.post("/trucks", upload.single("image"), adminController.addTruck);
router.put("/trucks/:id", upload.single("image"), adminController.updateTruck);
router.delete("/trucks/:id", adminController.deleteTruck);
router.put("/trucks/:id/maintenance", adminController.updateTruck);

// Drivers
router.get("/drivers/available", adminController.getAvailableDrivers);
router.get("/drivers", adminController.getAllDrivers);
router.post("/drivers", adminController.addDriver);
router.put("/drivers/:id", adminController.updateDriver);
router.delete("/drivers/:id", adminController.deleteDriver);

// Reports
router.get("/reports", adminController.getReports);
router.get("/reports/bookings", adminController.getAllBookingsReport);

module.exports = router;
