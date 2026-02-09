import { Router } from "express";

import {
  getUsers,
  changePassword,
  deleteAccount,
  updateProfile,
  updateProfileAvatar,
  changePhoneNumber,
  completeProfile,
} from "../controllers/user.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import {
  validateChangePassword,
  validateUpdateProfile,
  validateUpdatePhone,
} from "../middlewares/userValidate.middleware";
import upload from "../middlewares/upload";

const router = Router();

router.get("/", protectRoute, getUsers);

router.put(
  "/change-password",
  protectRoute,
  validateChangePassword,
  changePassword,
);
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
  "/complete-profile",
  protectRoute,
  validateUpdateProfile,
  completeProfile,
);

router.put(
  "/update-profile-avatar",
  protectRoute,
  upload.single("avatar"),
  updateProfileAvatar,
);

router.delete("/delete-account", protectRoute, deleteAccount);

export default router;
