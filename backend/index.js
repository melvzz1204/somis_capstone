require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const seedAdmin = require("./src/config/seedAdmin");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI;

// Connect to Database & Start Server
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully");

    // Seed initial Admin account
    await seedAdmin();

    // Start Express Server
    app.listen(PORT, () => {
      console.log(
        `✅ Server running in ${NODE_ENV} mode on http://localhost:${PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
