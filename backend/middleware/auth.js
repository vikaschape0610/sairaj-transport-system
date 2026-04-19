// ============================================================
// middleware/auth.js – ADMIN AUTH MIDDLEWARE
// ============================================================

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    // TokenExpiredError → 401 so frontend apiFetch triggers logout
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // Invalid/malformed token
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

module.exports = {
  verifyAdmin,
  verifyToken,
};