// ============================================================
// middleware/userAuth.js – User JWT Authentication Middleware
// ============================================================

const jwt = require("jsonwebtoken");

/**
 * Verifies a user's JWT from the Authorization header.
 * On success: attaches req.user = { userId, email, iat, exp }
 * On failure: returns 401 or 403.
 */
const verifyUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found. Please log in.",
      });
    }

    // JWT_SECRET must be set — server.js guards against missing env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject admin tokens on user routes
    if (decoded.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    req.user = decoded; // { userId, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

module.exports = verifyUser;
