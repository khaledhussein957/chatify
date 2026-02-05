import type { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

import type { AuthRequest } from "../middlewares/auth.middleware";

import Status from "../models/status.model";

import cloudinary from "../configs/cloudinary";

import { io } from "../utils/socket";

export const createStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { text, duration } = req.body;
    const file = req.file;

    // ❌ nothing provided
    if (!text && !file) {
      return res.status(400).json({ message: "Status cannot be empty" });
    }

    const isImage = file?.mimetype.startsWith("image/");
    const isVideo = file?.mimetype.startsWith("video/");

    // ❌ invalid media
    if (file && !isImage && !isVideo) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    let mediaUrl: string | undefined;
    let mediaPublicId: string | undefined;
    let mediaType: "image" | "video" | undefined;
    let videoDuration: number | undefined;

    if (file) {
      const filePath = path.resolve(file.path);

      const upload = await cloudinary.uploader.upload(filePath, {
        folder: "chatify/status",
        resource_type: "auto",
      });

      fs.unlinkSync(filePath);

      mediaUrl = upload.secure_url;
      mediaPublicId = upload.public_id;
      mediaType = isImage ? "image" : "video";

      // 🎥 video rule
      if (isVideo) {
        const parsedDuration = Number(duration);
        if (!parsedDuration || parsedDuration > 60) {
          return res.status(400).json({
            message: "Video duration must be 60 seconds or less",
          });
        }
        videoDuration = parsedDuration;
      }
    }

    const status = await Status.create({
      user: userId,
      text: text?.trim(),
      mediaUrl,
      mediaPublicId,
      mediaType,
      duration: videoDuration,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await status.populate("user", "name avatar");

    if (io) {
      io.emit("new-status", status);
    }

    res.status(201).json(status);
  } catch (error) {
    console.error("❌ Error in create status:", error);
    next(error);
  }
};

export const getStatuses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    const now = new Date();

    const statuses = await Status.find({
      expiresAt: { $gt: now }, // ⏱ only active (24h)
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    console.error("❌ Error in getStatuses:", error);
    next(error);
  }
};

export const viewStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });

    // Don't count the owner's own views
    if (status.user.toString() === userId) {
      return res.status(200).json({ message: "Viewed", viewers: status.viewers });
    }

    // Ensure viewers array only contains ObjectIds
    const viewerObjectId = userId; // if your schema uses ObjectId, this is fine

    // push userId to viewers if not already
    if (!status.viewers.includes(viewerObjectId as any)) {
      status.viewers.push(viewerObjectId as any); // typecast to ObjectId
      await status.save();

      // notify status owner in real-time
      if (io) {
        io.to(`user:${status.user.toString()}`).emit("status-viewed", {
          statusId,
          viewerId: userId,
        });
      }
    }

    res.status(200).json({ message: "Viewed", viewers: status.viewers });
  } catch (err) {
    console.error("❌ Error in viewStatus:", err);
    next(err);
  }
};

export const getStatusViewers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId).populate(
      "viewers",
      "name avatar",
    );
    if (!status) return res.status(404).json({ message: "Status not found" });

    res.status(200).json({ viewers: status.viewers });
  } catch (err) {
    console.error("❌ Error in getStatusViewers:", err);
    next(err);
  }
};

export const getUserStatuses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const statuses = await Status.find({
      user: userId,
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (err) {
    console.error("❌ Error in getUserStatuses:", err);
    next(err);
  }
};

export const deleteStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;

    const status = await Status.findOne({
      _id: statusId,
      user: userId,
    });

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // 🧹 delete media from Cloudinary
    if (status.mediaPublicId) {
      try {
        await cloudinary.uploader.destroy(status.mediaPublicId, {
          resource_type: status.mediaType === "video" ? "video" : "image",
        });
      } catch (err) {
        console.error("❌ Failed to delete Cloudinary media:", err);
      }
    }

    await status.deleteOne();

    // 🔔 notify clients
    if (io) {
      io.emit("status-deleted", { statusId });
    }

    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    console.error("❌ Error in deleteStatus:", error);
    next(error);
  }
};
