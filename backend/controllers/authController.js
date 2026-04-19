// ============================================================
// controllers/authController.js – Signup, Login & Forgot Password
// ============================================================

const transporter = require("../config/mailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "24h";

// ── Validation helpers ────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (v) => EMAIL_RE.test((v || "").trim());

// ── POST /api/auth/signup ─────────────────────────────────────
// Direct signup — account created immediately, JWT returned
const signup = async (req, res) => {
  try {
    const { name, email, phone, company, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required.",
      });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone must be a 10-digit number." });
    }

    const normalEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findByEmail(normalEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = await User.create({
      name: name.trim(),
      email: normalEmail,
      phone: phone.trim(),
      company: company ? company.trim() : null,
      password: hashedPassword,
    });

    // Issue JWT immediately
    const token = jwt.sign(
      { userId, email: normalEmail },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalEmail,
        phone: phone.trim(),
        company: company ? company.trim() : null,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during signup." });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// ── POST /api/auth/send-otp ───────────────────────────────────
// Forgot password OTP (unchanged)
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    if (!isEmail(email)) return res.status(400).json({ success: false, message: "Invalid email format." });

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: "If this email is registered, an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otpHash = await bcrypt.hash(otp, 8);
    await User.saveOtp(email.trim().toLowerCase(), otpHash, expiry);

    await transporter.sendMail({
      from: `"Sairaj Transport" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: "Your Sairaj Transport OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:20px 24px;border-radius:8px 8px 0 0;text-align:center;">
            <h2 style="color:#fff;margin:0;font-size:1.2rem;">Password Reset OTP</h2>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#374151;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#374151;">Use the code below to reset your Sairaj Transport account password.</p>
            <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
              <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.4em;color:#1d4ed8;">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:.85rem;">This code expires in <strong>5 minutes</strong>.</p>
            <p style="color:#6b7280;font-size:.85rem;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: "If this email is registered, an OTP has been sent." });
  } catch (error) {
    console.error("Send OTP Error:", error.message);
    res.status(500).json({ success: false, message: "Error sending OTP." });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "OTP must be a 6-digit number." });
    }

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }
    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect OTP." });
    }

    res.json({ success: true, message: "OTP verified." });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── POST /api/auth/reset-password ────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "OTP must be a 6-digit number." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }
    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(email.trim().toLowerCase(), hashedPassword);
    await User.saveOtp(email.trim().toLowerCase(), null, null);

    res.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { signup, login, sendOtp, verifyOtp, resetPassword };
