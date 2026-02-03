import { Router } from "express";

import {
  getUsers,
  changePassword,
  deleteAccount,
  updateProfile,
  updateProfileAvatar,
} from "../controllers/user.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import {
  validateChangePassword,
  validateUpdateProfile,
} from "../middlewares/userValidate.middleware";

const router = Router();

router.get("/", protectRoute, getUsers);

router.put(
  "/change-password",
  protectRoute,
  validateChangePassword,
  changePassword,
);
router.put(
  "/update-profile",
  protectRoute,
  validateUpdateProfile,
  updateProfile,
);
router.put("/update-profile-avatar", protectRoute, updateProfileAvatar);

router.delete("/delete-account", protectRoute, deleteAccount);

export default router;
