import jwt from "jsonwebtoken";
import ENV from "../configs/env";

export const generateToken = (userId: string): string => {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    { userId },
    ENV.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
