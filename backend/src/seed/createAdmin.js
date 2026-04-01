import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { connectDB } from "../config/db.js";
import AdminUser from "../models/AdminUser.js";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: npm run seed:admin -- <email> <password>");
  process.exit(1);
}

try {
  await connectDB(process.env.MONGO_URI);

  const normalizedEmail = email.toLowerCase().trim();

  const exists = await AdminUser.findOne({ email: normalizedEmail });

  if (exists) {
    console.log("Admin already exists:", normalizedEmail);
    process.exit(0);
  }

  await AdminUser.create({
    name: "Admin",
    email: normalizedEmail,
    password: password, // model will hash automatically
    role: "ADMIN",
  });

  console.log("✅ Admin created:", normalizedEmail);
  process.exit(0);

} catch (error) {
  console.error("❌ Seed failed");
  console.error("message:", error.message);
  console.error("code:", error.code);
  process.exit(1);
}