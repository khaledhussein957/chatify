import Express from "express";
import { clerkMiddleware } from "@clerk/express";

import ENV from "./configs/env";
import connectDB from "./configs/db";

import authRoute from "./routes/auth.route";

const app = Express();

app.use(Express.json());
app.use(clerkMiddleware());

app.use("/api/auth", authRoute);

const starServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`✅ Server is running on http://localhost:${ENV.PORT}`);
  });
};

starServer();
