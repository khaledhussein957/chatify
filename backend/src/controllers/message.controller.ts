import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import Message from "../models/message.model";
import Chat from "../models/chat.model";
import cloudinary from "../configs/cloudinary";
import path from "path";
import fs from "fs";
import { io } from "../utils/socket";
import User from "../models/user.model";

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    const formatted = messages.map((m) => {
      if (m.deleted) {
        return {
          ...m.toObject(),
          text: "🚫 This message was deleted",
          content: undefined,
        };
      }
      return m;
    });

    res.json(formatted);
  } catch (error) {
    console.log(`Error in get messages: ${error}`);
    next(error);
  }
};

export const sendMessageWithContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { chatId, text, duration } = req.body;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      console.warn("Chat not found for message send:", chatId);
      return res.status(404).json({ message: "Chat not found" });
    }

    let contentUrl: string | undefined = undefined;
    let contentPublicId: string | undefined = undefined;
    let messageType: "text" | "image" | "video" | "voice" = "text";

    // if a file was uploaded via multer, upload it to Cloudinary
    if (req.file) {
      const filePath = path.resolve(req.file.path);
      console.log("Uploading file to Cloudinary:", filePath);

      const isAudio =
        req.file.mimetype.startsWith("audio") ||
        (duration &&
          !req.file.mimetype.startsWith("video") &&
          !req.file.mimetype.startsWith("image"));
      if (isAudio) messageType = "voice";
      else if (req.file.mimetype.startsWith("image")) messageType = "image";
      else if (req.file.mimetype.startsWith("video")) messageType = "video";

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: "chatify",
        resource_type: isAudio ? "video" : "auto", // Cloudinary uses video for audio
      });

      contentUrl = uploadResult.secure_url as string;
      contentPublicId = uploadResult.public_id as string; // ✅ save it
      console.log("File uploaded successfully:", contentUrl);

      // remove local file after upload
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      type: messageType,
      text: text || "",
      content: contentUrl,
      contentPublicId,
      duration: duration ? Number(duration) : undefined,
    });

    await message.save();

    chat.lastMessage = message._id as any;
    chat.lastMessageAt = new Date();
    await chat.save();

    await message.populate("sender", "name avatar");

    // Socket Emission
    if (io) {
      console.log("Emitting new-message via socket for file attachment");
      // to the chat room
      io.to(`chat:${chatId}`).emit("new-message", message);

      // to other participants personal rooms
      chat.participants.forEach((participantId) => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== userId) {
          const userRoom = `user:${participantIdStr}`;
          const chatRoom = `chat:${chatId}`;

          const chatRoomSockets = io.sockets.adapter.rooms.get(chatRoom);
          const userRoomSockets = io.sockets.adapter.rooms.get(userRoom);

          if (userRoomSockets) {
            userRoomSockets.forEach((socketId) => {
              if (!chatRoomSockets?.has(socketId)) {
                io.to(socketId).emit("new-message", message);
              }
            });
          }
        }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(`❌ Error in send message with content:`, error);
    next(error);
  }
};

// update text message with in 5m
export const updateTextMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) {
      console.warn("Message not found for update:", messageId);
      return res.status(404).json({ message: "Message not found" });
    }

    // check if message is already deleted
    if (message.deleted) {
      console.warn("Message already deleted:", messageId);
      return res.status(400).json({ message: "Message already deleted" });
    }

    // only allow updating text messages
    if (message.type !== "text") {
      console.warn("Editing non-text message:", messageId);
      return res
        .status(400)
        .json({ message: "Only text messages can be edited" });
    }

    // check if message less than 5m old
    if (new Date().getTime() - message.createdAt.getTime() > 5 * 60 * 1000) {
      console.warn("Message too old to update:", messageId);
      return res.status(400).json({ message: "Message too old to update" });
    }

    message.text = text;
    await message.save();

    // Socket Emission
    if (io) {
      io.to(`chat:${message.chat}`).emit("message-updated", {
        messageId: message._id,
        text: message.text,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error(`❌ Error in update text message:`, error);
    next(error);
  }
};

// delete message
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) {
      console.warn("Message not found for deletion:", messageId);
      return res.status(404).json({ message: "Message not found" });
    }

    // if it's content message, delete it from cloudinary
    if (message.contentPublicId) {
      try {
        await cloudinary.uploader.destroy(message.contentPublicId);
        console.log("File deleted successfully from Cloudinary");
      } catch (error) {
        console.error("❌ Failed to delete Cloudinary file:", error);
      }
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Socket Emission
    if (io) {
      io.to(`chat:${message.chat}`).emit("message-deleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(`❌ Error in delete message:`, error);
    next(error);
  }
};
// send voice message
export const sendVoiceMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { chatId, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const filePath = path.resolve(req.file.path);

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "chatify/voice",
      resource_type: "video", // Cloudinary uses video for audio
    });

    // remove local file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      type: "voice",
      text: "",
      content: uploadResult.secure_url,
      contentPublicId: uploadResult.public_id,
      duration: duration ? Number(duration) : undefined,
    });

    await message.save();

    chat.lastMessage = message._id as any;
    chat.lastMessageAt = new Date();
    await chat.save();

    await message.populate("sender", "name avatar");

    // Socket Emission
    if (io) {
      io.to(`chat:${chatId}`).emit("new-message", message);

      chat.participants.forEach((participantId) => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== userId) {
          const userRoom = `user:${participantIdStr}`;
          const chatRoom = `chat:${chatId}`;
          const chatRoomSockets = io.sockets.adapter.rooms.get(chatRoom);
          const userRoomSockets = io.sockets.adapter.rooms.get(userRoom);

          if (userRoomSockets) {
            userRoomSockets.forEach((socketId) => {
              if (!chatRoomSockets?.has(socketId)) {
                io.to(socketId).emit("new-message", message);
              }
            });
          }
        }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(`❌ Error in send voice message:`, error);
    next(error);
  }
};
