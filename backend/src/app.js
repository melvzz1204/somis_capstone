const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const memberRoutes = require("./routes/memberOrgRoutes");
<<<<<<< HEAD
const feeRoutes = require("./routes/feeRoutes");
=======
const collegeRoutes = require("./routes/collegeRoutes");
const feeRoutes = require("./routes/feeRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
>>>>>>> origin/module-1

const app = express();

// 1. CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
<<<<<<< HEAD
app.use("/api/orgmembers", memberRoutes);
app.use("/api/fees", feeRoutes);
=======
app.use("/api/v1/orgmembers", memberRoutes);
app.use("/api/v1/colleges", collegeRoutes);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/proposals", proposalRoutes);
>>>>>>> origin/module-1

// 5. Base Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "MarSU SOMIS API is running...",
    env: process.env.NODE_ENV || "development",
  });
});

// 6. Multer & Global Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "A selected file exceeds the allowed upload size.",
      });
    }
    if (
      err.code === "LIMIT_FILE_COUNT" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res
        .status(400)
        .json({ message: "No more than 5 attachments are allowed." });
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
