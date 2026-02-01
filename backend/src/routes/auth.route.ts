import { Router } from "express";

import { getMe, authCallback } from "../controllers/auth.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", protectRoute, getMe);

router.post("/callback", authCallback);

export default router;