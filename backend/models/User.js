// ============================================================
// models/User.js – User Database Queries (PostgreSQL)
// ============================================================

const db = require("../config/db");

const User = {
  // Find a user by their email address
  findByEmail: async (email) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0];
  },

  // Find a user by their ID
  findById: async (id) => {
    const [rows] = await db.execute(
      "SELECT id, name, email, phone, company, created_at FROM users WHERE id = $1",
      [id],
    );
    return rows[0];
  },

  // Create a new user — returns the new user's id
  create: async ({ name, email, phone, company, password }) => {
    const [rows] = await db.execute(
      "INSERT INTO users (name, email, phone, company, password) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, phone, company || null, password],
    );
    return rows[0].id;
  },

  // Update password (forgot-password flow)
  updatePassword: async (email, password) => {
    await db.execute("UPDATE users SET password = $1 WHERE email = $2", [
      password,
      email,
    ]);
  },

  // Save OTP hash + expiry (forgot-password flow)
  saveOtp: async (email, otp, expiry) => {
    await db.execute(
      "UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3",
      [otp, expiry, email],
    );
  },
};

module.exports = User;
