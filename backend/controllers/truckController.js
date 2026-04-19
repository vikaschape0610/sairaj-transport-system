const Truck = require("../models/Truck");

// ── GET /api/trucks ──────────────────────────────────────────
// Supports optional query params: ?capacity=upto12&type=Container
const getTrucks = async (req, res) => {
  try {
    const { capacity, type } = req.query;

    const trucks = await Truck.getAll({ capacity, type });

    res.json({
      success: true,
      count: trucks.length,
      data: trucks,
    });
  } catch (error) {
    console.error("Get Trucks Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch trucks." });
  }
};

module.exports = { getTrucks };
