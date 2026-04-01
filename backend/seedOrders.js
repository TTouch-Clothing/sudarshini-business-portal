import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Order from "./src/models/Order.js";

dotenv.config();

const filePath = path.resolve("orders-seed-50.json");

async function seedOrders() {
  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const raw = fs.readFileSync(filePath);
    const orders = JSON.parse(raw);

    for (const order of orders) {

      const normalizedPhone = order.phone
        ?.replace(/\D/g, "")
        ?.slice(-11);

      await Order.updateOne(
        { orderId: order.orderId },
        {
          ...order,
          normalizedPhone
        },
        { upsert: true }
      );

    }

    console.log(`✅ ${orders.length} Orders inserted/updated`);

    await mongoose.disconnect();

    console.log("MongoDB disconnected");

  } catch (err) {

    console.error("❌ Seed Error:", err.message);

  }
}

seedOrders();