require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const users = await db.collection("users").find({}).toArray();
  const byDay = {};
  for (const u of users) {
    const d = u.createdAt ? new Date(u.createdAt) : null;
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }
  const days = Object.keys(byDay).sort();
  console.log("Users created per day (all roles/accounts):");
  for (const d of days) console.log(`  ${d}: ${byDay[d]}`);
  console.log("Total users:", users.length);

  // Also members with hasAccount/created today vs invites, and profiles.
  const profiles = await db.collection("studentprofiles").countDocuments();
  console.log("Total student profiles:", profiles);

  await mongoose.disconnect();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
