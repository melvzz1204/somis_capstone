const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const memberRoutes = require("./routes/memberOrgRoutes");
const feeRoutes = require("./routes/feeRoutes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Serve Static Uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 4. Mount API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/orgmembers", memberRoutes);
app.use("/api/fees", feeRoutes);

// 5. Base Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "MarSU SOMIS API is running...",
    env: process.env.NODE_ENV || "development",
  });
});
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image is too large! Maximum allowed size is 5MB.",
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res
      .status(500)
      .json({ message: err.message || "An unexpected error occurred." });
  }

  next();
});
module.exports = app;
