import { Request, Response, NextFunction } from "express";

import {
  updatePhoneSchema,
  updateProfileSchema,
} from "../validators/user.validator";

export const validateUpdatePhone = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = updatePhoneSchema.validate(req.body);
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
