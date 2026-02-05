import { Router } from "express";

import {
  createStatus,
  getStatuses,
  viewStatus,
  getStatusViewers,
  getUserStatuses,
  deleteStatus,
} from "../controllers/status.controller";

import upload from "../middlewares/upload";

import { protectRoute } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protectRoute, upload.single("media"), createStatus);
router.get("/", protectRoute, getStatuses);
router.post("/:statusId/view", protectRoute, viewStatus);
router.get("/:statusId/viewers", protectRoute, getStatusViewers);
router.get("/:userId", protectRoute, getUserStatuses);
router.delete("/:statusId", protectRoute, deleteStatus);

export default router;
