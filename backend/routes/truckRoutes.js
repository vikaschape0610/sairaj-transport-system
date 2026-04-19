// ============================================================
// routes/truckRoutes.js – Truck Routes
// ============================================================

const express = require("express");
const router = express.Router();
const { getTrucks } = require("../controllers/truckController");

// GET /api/trucks               – Get all trucks (available, non-maintenance)
// GET /api/trucks?type=Container – Filter by type
// GET /api/trucks?capacity=upto12 – Filter by capacity
// GET /api/trucks?capacity=12to20&type=Open+Body – Multiple filters
router.get("/", getTrucks);
router.get("/available", getTrucks);
module.exports = router;
