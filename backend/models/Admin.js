// ============================================================
// models/Admin.js – Admin Database Queries (PostgreSQL)
// ============================================================

const db = require("../config/db");
const bcrypt = require("bcryptjs");

const Admin = {
  // 🔍 FIND ADMIN BY EMAIL
  findByEmail: async (email) => {
    try {
      if (!email) return null;

      const [rows] = await db.execute(
        "SELECT * FROM admins WHERE email = $1",
        [email],
      );

      return rows.length ? rows[0] : null;
    } catch (err) {
      console.error("findByEmail Error:", err.message);
      throw err;
    }
  },

  // 🔍 FIND ADMIN BY ID
  findById: async (id) => {
    try {
      if (!id) return null;

      const [rows] = await db.execute(
        "SELECT id, email, created_at FROM admins WHERE id = $1",
        [id],
      );

      return rows.length ? rows[0] : null;
    } catch (err) {
      console.error("findById Error:", err.message);
      throw err;
    }
  },

  // ➕ CREATE ADMIN (FOR SEEDING ONLY)
  create: async ({ email, password }) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // 🔐 Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      const [rows] = await db.execute(
        "INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id",
        [email, hashedPassword],
      );

      return rows[0].id;
    } catch (err) {
      console.error("Create Admin Error:", err.message);
      throw err;
    }
  },
};

module.exports = Admin;
