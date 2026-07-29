const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@marsu.edu.ph";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: process.env.ADMIN_NAME || "MarSU SOMIS Admin",
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || "AdminPass2026!",
        role: "admin",
      });
      console.log(`👑 Admin account created successfully: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin account verified: ${adminEmail}`);
    }
  } catch (error) {
    console.error("❌ Failed to seed Admin account:", error.message);
  }
};

module.exports = seedAdmin;
