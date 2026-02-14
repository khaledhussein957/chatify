import { Request, Response, NextFunction } from "express";

import {
  registerSchema,
  verifyCode,
  resendOtpSchema,
  updateProfileSchema,
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

export const validateVerifyCode = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = verifyCode.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = updateProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateResendOtp = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = resendOtpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
