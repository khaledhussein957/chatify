import { Router } from "express";

import {
  getMe,
  forgotPassword,
  login,
  register,
  resendCode,
  resetPassword,
} from "../controllers/auth.controller";

import { protectRoute } from "../middlewares/auth.middleware";
import {
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResendCode,
  validateResetPassword,
} from "../middlewares/authValidate.middleware";

const router = Router();

router.get("/me", protectRoute, getMe);

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-code", validateResendCode, resendCode);
router.post("/reset-password", validateResetPassword, resetPassword);
export default router;
