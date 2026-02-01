import Express from "express";
import { clerkMiddleware } from "@clerk/express";

import ENV from "./configs/env";
import connectDB from "./configs/db";

import authRoute from "./routes/auth.route";

import { errorHandler } from "./middlewares/errorHandler.middleware";

const app = Express();

// Middlewares
app.use(Express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/auth", authRoute);

// Error Handling Middleware
app.use(errorHandler);



const starServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`✅ Server is running on http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

starServer();
