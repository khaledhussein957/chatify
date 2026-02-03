import { Request, Response, NextFunction } from "express";

import {
  registerSchema,
  forgotPasswordSchema,
  loginSchema,
  resendCodeSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = forgotPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateResendCode = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = resendCodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
