import { Router } from "express";

import { getChats, getOrCreateChat } from "../controllers/chat.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protectRoute, getChats);

router.post("/with/:participantId", protectRoute, getOrCreateChat);

export default router;
