import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";

import Notification from "../models/notification.model";

export const createNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, title, body, type, data } = req.body;

    const notification = new Notification({
      user: userId,
      title,
      body,
      type,
      data,
    });

    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    console.error(`❌ Error in create notification:`, error);
    next(error);
  }
};

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error(`❌ Error in get notifications:`, error);
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error(`❌ Error in mark notification as read:`, error);
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(`❌ Error in mark all notifications as read:`, error);
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error(`❌ Error in delete notification:`, error);
    next(error);
  }
};
