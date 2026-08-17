import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

let isConnected = false;

export const connectToDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    isConnected = true;

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);

    throw new Error("Failed to connect to MongoDB");
  }
};