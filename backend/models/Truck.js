// ============================================================
// models/Truck.js – Truck Database Queries (PostgreSQL)
// ============================================================

const db = require("../config/db");

const Truck = {
  // Get all trucks (with optional filters)
  // Public listing: only show active trucks that are not under Maintenance
  getAll: async ({ capacity, type } = {}) => {
    // PostgreSQL: use true instead of 1 for boolean
    let query =
      "SELECT * FROM trucks WHERE is_active = true AND status != 'Maintenance'";
    const params = [];
    let paramIdx = 1;

    // Filter by truck type (case-insensitive)
    if (type && type !== "all") {
      query += ` AND LOWER(type) = LOWER($${paramIdx++})`;
      params.push(type);
    }

    // Filter by capacity range
    if (capacity === "upto12") {
      query += " AND capacity_tons <= 12";
    } else if (capacity === "12to20") {
      query += " AND capacity_tons > 12 AND capacity_tons <= 20";
    } else if (capacity === "20plus") {
      query += " AND capacity_tons > 20";
    }

    query += " ORDER BY id ASC";

    const [rows] = await db.execute(query, params);
    return rows;
  },

  // Get a single truck by ID
  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM trucks WHERE id = $1", [id]);
    return rows[0];
  },
};

module.exports = Truck;
