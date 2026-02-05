import { Router } from "express";

import {
  getChats,
  getOrCreateChat,
  getOrCreateGroupChat,
} from "../controllers/chat.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protectRoute, getChats);

router.post("/with/group", protectRoute, getOrCreateGroupChat);
router.post("/with/:participantId", protectRoute, getOrCreateChat);

export default router;
