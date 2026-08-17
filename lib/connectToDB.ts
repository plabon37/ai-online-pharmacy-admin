import mongoose from "mongoose";

export const connectToDB = async () => {
    const dbUri = process.env.MONGODB_URI as string;
    if (!dbUri) {
        throw new Error("MONGODB_URI environment variable is not defined");
    }
    await mongoose
        .connect(dbUri)
        .then(() => {
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err);
        });
};