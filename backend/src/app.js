const express = require("express");
const cors = require("cors");
const path = require("path");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const memberRoutes = require("./routes/memberOrgRoutes");
const feeRoutes = require("./routes/feeRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
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
app.use("/api/orgmembers", memberRoutes);
app.use("/api/fees", feeRoutes);

// 5. Base Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "MarSU SOMIS API is running...",
    env: process.env.NODE_ENV || "development",
  });
});

module.exports = app;
