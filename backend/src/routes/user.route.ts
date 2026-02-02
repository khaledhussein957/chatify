import { Router } from "express";

import { getUsers } from "../controllers/user.controller";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protectRoute, getUsers);

export default router;