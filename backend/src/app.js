const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  next();
});

// Mount Routes
app.use("/api/v1/auth", authRoutes);

// Base Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "MarSU SOMIS API is running...",
    env: process.env.NODE_ENV || "development",
  });
});

module.exports = app;
