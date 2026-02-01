import mongoose from "mongoose";

import ENV from "./env";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
