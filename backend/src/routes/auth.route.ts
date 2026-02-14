import { Router } from "express";

import {
  getMe,
  register,
  verifyCode,
  resendOtp,
  completeProfile,
} from "../controllers/auth.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import {
  validateRegister,
  validateVerifyCode,
  validateResendOtp,
  validateUpdateProfile,
} from "../middlewares/authValidate.middleware";

const router = Router();

router.get("/me", protectRoute, getMe);

router.post("/register", validateRegister, register);
router.post("/verify-code", validateVerifyCode, verifyCode);
router.put(
  "/complete-profile",
  protectRoute,
  validateUpdateProfile,
  completeProfile,
);
router.post("/resend-code", validateResendOtp, resendOtp);
export default router;
