const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const realtimeUpdates = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let hasEmitted = false;
  const emitUpdate = () => {
    if (hasEmitted || res.statusCode >= 400 || !req.app.locals.io) return;
    hasEmitted = true;
    req.app.locals.io.emit("data-updated", {
      resource: req.path.split("/").filter(Boolean)[0] || "global",
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  };

  res.json = (body) => {
    emitUpdate();
    return originalJson(body);
  };
  res.send = (body) => {
    emitUpdate();
    return originalSend(body);
  };

  return next();
};

// Route Imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const memberRoutes = require("./routes/memberOrgRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const feeRoutes = require("./routes/feeRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

// 1. CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://m84kwbsn-5173.asse.devtunnels.ms",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Broadcast successful writes to every connected frontend.
// Pages use this signal to rerun their existing API queries without a refresh.
app.use(realtimeUpdates);

// 4. Serve Static Uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 5. Mount API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/orgmembers", memberRoutes);
app.use("/api/v1/colleges", collegeRoutes);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/proposals", proposalRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/payments", paymentRoutes);

// 6. Base Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "MarSU SOMIS API is running...",
    env: process.env.NODE_ENV || "development",
  });
});

// 7. Multer & Global Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "The selected file exceeds the allowed upload size.",
      });
    }
    if (
      err.code === "LIMIT_FILE_COUNT" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The upload contains an unexpected file field or too many files.",
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res
      .status(400)
      .json({ message: err.message || "An unexpected error occurred." });
  }

  next();
});

module.exports = app;
