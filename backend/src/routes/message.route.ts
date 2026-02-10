import { Router } from "express";

import {
  getMessages,
  sendMessage,
  sendMessageWithContent,
  updateTextMessage,
  deleteMessage,
  sendVoiceMessage,
} from "../controllers/message.controller";
import upload from "../middlewares/upload";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.post("/send", protectRoute, upload.single("content"), sendMessage);

router.post("/voice", protectRoute, upload.single("content"), sendVoiceMessage);

router.get("/:chatId", protectRoute, getMessages);

router.put("/update/:messageId", protectRoute, updateTextMessage);

router.delete("/delete/:messageId", protectRoute, deleteMessage);

export default router;
