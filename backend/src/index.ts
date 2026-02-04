import Express from "express";
import { createServer } from "http";
import cors from "cors";

import ENV from "./configs/env";
import connectDB from "./configs/db";

import authRoute from "./routes/auth.route";
import chatRoute from "./routes/chat.route";
import messageRoute from "./routes/message.route";
import userRoute from "./routes/user.route";

import { errorHandler } from "./middlewares/errorHandler.middleware";

import { initializeSocket } from "./utils/socket";

const app = Express();

app.use(cors());

// Middlewares
app.use(Express.json());

// test route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

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
