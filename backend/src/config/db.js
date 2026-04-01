import mongoose from "mongoose";

export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing");
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error("message:", error.message);
    console.error("code:", error.code);
    throw error;
  }
}