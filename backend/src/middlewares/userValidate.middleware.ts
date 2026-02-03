import { Request, Response, NextFunction } from "express";

import {
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/user.validator";

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = changePasswordSchema.validate(req.body);
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
