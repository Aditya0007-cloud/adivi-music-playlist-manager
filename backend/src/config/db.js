import mongoose from "mongoose";

let connected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/adivi";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500
    });
    connected = true;
    console.log("MongoDB connected for Beatify");
  } catch (error) {
    connected = false;
    console.warn("MongoDB unavailable. Beatify is running in in-memory demo mode.");
    console.warn(error.message);
  }
};

export const isMongoConnected = () => connected && mongoose.connection.readyState === 1;
