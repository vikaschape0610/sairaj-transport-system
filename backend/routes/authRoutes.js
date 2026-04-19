// ============================================================
// routes/authRoutes.js – Auth Routes with Rate Limiting
// ============================================================

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  signup,
  login,
  sendOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

// ── Rate limiters ─────────────────────────────────────────────

// OTP endpoint: max 5 requests per 15 minutes per IP
// Prevents OTP brute-force and email spam
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many OTP requests. Please wait 15 minutes before trying again.",
  },
  skipSuccessfulRequests: false,
});

// Login endpoint: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please wait 15 minutes before trying again.",
  },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

// Signup endpoint: max 5 new accounts per hour per IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many accounts created. Please try again later.",
  },
});

// Password reset: max 5 attempts per 15 minutes per IP
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many reset attempts. Please wait 15 minutes before trying again.",
  },
});

// ── Routes ────────────────────────────────────────────────────
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/reset-password", resetLimiter, resetPassword);

module.exports = router;
