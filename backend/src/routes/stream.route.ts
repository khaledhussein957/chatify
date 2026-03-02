import { Router, Request, Response } from "express";
import { StreamChat } from "stream-chat";
import { protectRoute, AuthRequest } from "../middlewares/auth.middleware";
import ENV from "../configs/env";

const router = Router();

router.post("/token", protectRoute, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!ENV.STREAM_API_KEY || !ENV.STREAM_SECRET_KEY) {
      res.status(500).json({ error: "Stream credentials not configured" });
      return;
    }

    const client = StreamChat.getInstance(
      ENV.STREAM_API_KEY,
      ENV.STREAM_SECRET_KEY,
    );
    const token = client.createToken(userId);

    res.status(200).json({ token });
  } catch (error) {
    console.error("Stream token generation error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
