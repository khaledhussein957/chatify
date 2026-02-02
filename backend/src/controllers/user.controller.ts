import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import User  from "../models/user.model";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar")
      .limit(50);

    res.json(users);
  } catch (error) {
    console.log(`Error in get users: ${error}`);
    res.status(500).json({ message: "Internal server error" });
    next(error);
  }
}