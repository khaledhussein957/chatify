import Express from "express";
import { createServer } from "http";
import { clerkMiddleware } from "@clerk/express";

import ENV from "./configs/env";
import connectDB from "./configs/db";

import authRoute from "./routes/auth.route";
import chatRoute from "./routes/chat.route";
import messageRoute from "./routes/message.route";
import userRoute from "./routes/user.route";

import { errorHandler } from "./middlewares/errorHandler.middleware";

import { initializeSocket } from "./utils/socket";

const app = Express();

// Middlewares
app.use(Express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/users", userRoute);

// Error Handling Middleware
app.use(errorHandler);

// Initialize Socket.io on an HTTP server
const server = createServer(app);
initializeSocket(server);

const starServer = async () => {
  try {
    await connectDB();
    server.listen(ENV.PORT, () => {
      console.log(`✅ Server is running on http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

starServer();
