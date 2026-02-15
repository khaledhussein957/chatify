import { Router } from "express";

import {
  getChats,
  getOrCreateChat,
  getOrCreateGroupChat,
  leaveGroupChat,
  addMember,
  deleteChat,
} from "../controllers/chat.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protectRoute, getChats);

router.post("/with/group", protectRoute, getOrCreateGroupChat);
router.post("/with/:participantId", protectRoute, getOrCreateChat);

router.post("/:chatId/add-member", protectRoute, addMember);

router.delete("/:chatId", protectRoute, deleteChat);
router.delete("/:chatId/leave", protectRoute, leaveGroupChat);

export default router;
