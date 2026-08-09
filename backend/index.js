require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./src/app");
const seedAdmin = require("./src/config/seedAdmin");
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "❌ CRITICAL ERROR: MONGO_URI is missing in environment variables (.env file).",
  );
  process.exit(1);
}

// Connect to Database & Start Server
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully");

    // Seed initial Admin account safely
    try {
      await seedAdmin();
    } catch (seedErr) {
      console.error("⚠️ Warning: Seed admin failed:", seedErr.message);
    }

    // Start HTTP server and attach Socket.IO to the same port as the API.
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "https://vercel.app",
        ],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 Realtime client connected: ${socket.id}`);
      socket.on("disconnect", () => {
        console.log(`🔌 Realtime client disconnected: ${socket.id}`);
      });
    });

    /*     app.locals.io = io;
    httpServer.listen(PORT, () => {
      console.log(
        `✅ Server running in ${NODE_ENV} mode on http://localhost:${PORT}`,
      );
    });
  }) */
    app.locals.io = io;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(
        `✅ Server running safely on port ${PORT} in ${process.env.NODE_ENV || "production"} mode`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!");
    console.error("Error Details:", err.message);
    process.exit(1);
  });
