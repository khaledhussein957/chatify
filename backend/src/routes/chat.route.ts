import { Router } from "express";

import {
  getChats,
  getOrCreateChat,
  getOrCreateGroupChat,
  leaveGroupChat,
  addMember,
  deleteChat,
  updateGroupName,
  updateGroupAvatar,
} from "../controllers/chat.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload";

const router = Router();

router.get("/", protectRoute, getChats);

router.post("/with/group", protectRoute, getOrCreateGroupChat);
router.post("/with/:participantId", protectRoute, getOrCreateChat);

router.post("/:chatId/add-member", protectRoute, addMember);
router.put("/:chatId/update-group-name", protectRoute, updateGroupName);
router.put(
  "/:chatId/update-group-avatar",
  protectRoute,
  upload.single("groupImage"),
  updateGroupAvatar,
);

router.delete("/:chatId", protectRoute, deleteChat);
router.delete("/:chatId/leave", protectRoute, leaveGroupChat);

export default router;
