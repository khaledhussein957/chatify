import { Router } from "express";

import {
  getChats,
  getOrCreateChat,
  getOrCreateGroupChat,
  leaveGroupChat,
  deleteChat,
} from "../controllers/chat.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protectRoute, getChats);

router.post("/with/group", protectRoute, getOrCreateGroupChat);
router.post("/with/:participantId", protectRoute, getOrCreateChat);

router.delete("/:chatId", protectRoute, deleteChat);
router.delete("/:chatId/leave", protectRoute, leaveGroupChat);

export default router;
