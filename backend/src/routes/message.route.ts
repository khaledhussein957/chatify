import { Router } from "express";

import { getMessages, sendMessageWithContent } from "../controllers/message.controller";
import upload from "../middlewares/upload";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.post("/send", protectRoute, upload.single("content"), sendMessageWithContent);

router.get("/:chatId", protectRoute, getMessages);

export default router;