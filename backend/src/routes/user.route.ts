import { Router } from "express";

import {
  getUsers,
  deleteAccount,
  updateProfile,
  updateProfileAvatar,
  changePhoneNumber,
} from "../controllers/user.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import {
  validateUpdateProfile,
  validateUpdatePhone,
} from "../middlewares/userValidate.middleware";
import upload from "../middlewares/upload";

const router = Router();

router.get("/", protectRoute, getUsers);

router.put(
  "/update-phone",
  protectRoute,
  validateUpdatePhone,
  changePhoneNumber,
);
router.put(
  "/update-profile",
  protectRoute,
  validateUpdateProfile,
  updateProfile,
);

router.put(
  "/update-profile-avatar",
  protectRoute,
  upload.single("avatar"),
  updateProfileAvatar,
);

router.delete("/delete-account", protectRoute, deleteAccount);

export default router;
