const express = require("express");
const cors = require("cors");
const compression = require("compression");
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
    // Derive the resource from the real URL (/api/v1/events/... -> "events").
    // req.path is still the full path because this middleware runs before the
    // routers, so splitting it directly would always yield "api".
    const pathname = String(req.originalUrl || req.url || "").split("?")[0];
    const segments = pathname.split("/").filter(Boolean);
    let resource = "global";
    if (segments[0] === "api") {
      resource =
        segments[1] === "v1"
          ? segments[2] || "global"
          : segments[1] || "global";
    } else {
      resource = segments[0] || "global";
    }
    req.app.locals.io.emit("data-updated", {
      resource,
      method: req.method,
      organization: req.user?.organization
        ? String(req.user.organization)
        : null,
      path: pathname,
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
const resolutionRoutes = require("./routes/resolutionRoutes");
const organizationDocumentRoutes = require("./routes/organizationDocumentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const announcementRoutes = require("./routes/announcementRoutes");

const app = express();

const configuredFrontendOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .map((origin) => origin?.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header include health checks and server-to-server calls.
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed =
      configuredFrontendOrigins.includes(normalizedOrigin) ||
      normalizedOrigin === "http://localhost:5173" ||
      normalizedOrigin === "http://localhost:3000" ||
      normalizedOrigin === "http://127.0.0.1:5173" ||
      normalizedOrigin === "https://somis-capstone.vercel.app" ||
      /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(
        normalizedOrigin,
      );

    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS origin is not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Compress JSON responses (attendance rosters can exceed 200 KB uncompressed).
app.use(compression());

// Use the same CORS policy for browser preflight requests.
app.options(/(.*)/, cors(corsOptions));
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
app.use("/api/v1/resolutions", resolutionRoutes);
app.use("/api/v1/organization-documents", organizationDocumentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/announcements", announcementRoutes);
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
