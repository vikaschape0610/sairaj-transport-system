// ============================================================
// server.js – Sairaj Transport Backend Entry Point (Secured)
// ============================================================
require("dotenv").config();

// ── Guard: required env ───────────────────────────────────────
// DB connection: accept either DATABASE_URL (Railway preferred)
// OR individual DB_* vars (custom/Render setup)
const REQUIRED_ENV = ["JWT_SECRET", "EMAIL_USER", "EMAIL_PASS"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required ENV: ${key}`);
    process.exit(1);
  }
}

// Validate DB config presence (DATABASE_URL OR individual vars)
const hasDbUrl = !!process.env.DATABASE_URL;
const hasDbVars =
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME;

if (!hasDbUrl && !hasDbVars) {
  console.error(
    "❌ Missing DB config: set either DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME",
  );
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

// Routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const truckRoutes = require("./routes/truckRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// DB
require("./config/db");

const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// ── SOCKET.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      "https://sairajroadlines.in",
      "https://www.sairajroadlines.in",
      "https://sairaj-transport-system.vercel.app",
      "http://localhost:3000",
      "http://localhost:5001",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const { setIO } = require("./config/socketIO");
setIO(io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("joinUser", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room user_${userId}`);
  });

  socket.on("joinAdmin", () => {
    socket.join("adminRoom");
    console.log("👨‍💼 Admin joined adminRoom:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ── SECURITY ─────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// ── CORS (FINAL FIXED) ───────────────────────────────────────
const allowedOrigins = [
  "https://sairajroadlines.in",
  "https://www.sairajroadlines.in",
  "https://sairaj-transport-system.vercel.app",
  // Local development
  "http://localhost:3000",
  "http://localhost:5001",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// ── BODY ─────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMIT ───────────────────────────────────────────────
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
  }),
);

// ── STATIC ───────────────────────────────────────────────────
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── ROUTES ───────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// ── HEALTH ───────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ success: true, message: "API running" });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── ERROR HANDLER ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Error:", err.message);
  res.status(500).json({ success: false, message: "Server error" });
});

// ── START ────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚛 Server running on port ${PORT}`);
});