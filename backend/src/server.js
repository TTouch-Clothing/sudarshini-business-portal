import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import dns from "dns";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";

dotenv.config();

console.log("MONGO_URI loaded:", process.env.MONGO_URI ? "YES ✅" : "NO ❌");

if (process.env.MONGO_URI) {
  console.log(
    "Mongo URI preview:",
    process.env.MONGO_URI.substring(0, 30) + "..."
  );
}

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isVercelPreview =
      origin.endsWith(".vercel.app") &&
      origin.includes("sudarshini-business-portal");

    if (allowedOrigins.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).send("Sudarshini Dashboard backend is running");
});

app.head("/", (req, res) => {
  res.sendStatus(200);
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Server is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/prediction", predictionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

const port = process.env.PORT || 5000;

app.listen(port, "0.0.0.0", async () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ Allowed CLIENT_URL: ${process.env.CLIENT_URL || "Not set"}`);

  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed");
    console.error(err.message);
  }
});