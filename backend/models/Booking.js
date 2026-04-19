// models/Booking.js – PostgreSQL version
const db = require("../config/db");

const Booking = {
  create: async ({
    userId,
    pickupLocation,
    destination,
    goodsType,
    weight,
    pickupDate,
    deliveryDate,
    preferredTruckType,
    notes,
  }) => {
    const bookingId = "BK" + Math.floor(100000 + Math.random() * 900000);
    // RETURNING id gives us the auto-generated serial PK
    const [rows] = await db.execute(
      `INSERT INTO bookings
        (booking_id, user_id, pickup_location, destination, goods_type, weight_tons,
         pickup_date, delivery_date, preferred_truck_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
       RETURNING id`,
      [
        bookingId,
        userId,
        pickupLocation,
        destination,
        goodsType,
        weight,
        pickupDate,
        deliveryDate || null,
        preferredTruckType || null,
        notes || null,
      ],
    );
    return { insertId: rows[0].id, bookingId };
  },

  getByUserId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT b.*, t.truck_number, t.type AS truck_type, t.capacity_tons,
              COALESCE(b.actual_delivery_date, b.delivery_date) AS display_delivery_date
       FROM bookings b
       LEFT JOIN trucks t ON b.truck_id = t.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId],
    );
    return rows;
  },

  getByEmail: async (email) => {
    const [rows] = await db.execute(
      `SELECT b.*, t.truck_number, t.type AS truck_type, t.capacity_tons,
              COALESCE(b.actual_delivery_date, b.delivery_date) AS display_delivery_date
       FROM bookings b
       INNER JOIN users u ON b.user_id = u.id
       LEFT JOIN  trucks t ON b.truck_id = t.id
       WHERE u.email = $1
       ORDER BY b.created_at DESC`,
      [email],
    );
    return rows;
  },

  findByBookingId: async (bookingId) => {
    const [rows] = await db.execute(
      `SELECT b.*,
              COALESCE(b.actual_delivery_date, b.delivery_date) AS display_delivery_date,
              u.name   AS user_name,
              u.phone  AS user_phone,
              t.truck_number,
              t.type   AS truck_type,
              t.owner_name,
              t.owner_phone,
              d.name   AS driver_name,
              d.phone  AS driver_phone
       FROM bookings b
       LEFT JOIN users   u ON b.user_id   = u.id
       LEFT JOIN trucks  t ON b.truck_id  = t.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE b.booking_id = $1`,
      [bookingId],
    );
    return rows[0];
  },

  updateByUser: async (bookingId, fields) => {
    const allowed = [
      "pickup_location",
      "destination",
      "goods_type",
      "weight_tons",
      "pickup_date",
      "delivery_date",
      "notes",
    ];
    const setClauses = [],
      values = [];
    let paramIdx = 1;
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${key} = $${paramIdx++}`);
        values.push(fields[key] ?? null);
      }
    }
    if (setClauses.length === 0) return false;
    values.push(bookingId); // last param for WHERE
    const [, meta] = await db.execute(
      `UPDATE bookings SET ${setClauses.join(", ")} WHERE booking_id = $${paramIdx}`,
      values,
    );
    return meta.affectedRows > 0;
  },

  updateStatus: async (bookingId, status) => {
    const [, meta] = await db.execute(
      "UPDATE bookings SET status = $1 WHERE booking_id = $2",
      [status, bookingId],
    );
    return meta.affectedRows > 0;
  },
};

module.exports = Booking;
