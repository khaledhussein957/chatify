import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import Message from "../models/message.model";
import Chat from "../models/chat.model";
import cloudinary from "../configs/cloudinary";
import path from "path";
import fs from "fs";
import { io } from "../utils/socket";

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
      .sort({ createdAt: 1 }); // oldest first

    res.json(messages);
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
    const { chatId, text } = req.body;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      console.warn("Chat not found for message send:", chatId);
      return res.status(404).json({ message: "Chat not found" });
    }

    let contentUrl: string | undefined = undefined;

    // if a file was uploaded via multer, upload it to Cloudinary
    if (req.file) {
      const filePath = path.resolve(req.file.path);
      console.log("Uploading file to Cloudinary:", filePath);

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: "chatify",
        resource_type: "auto",
      });

      contentUrl = uploadResult.secure_url as string;
      console.log("File uploaded successfully:", contentUrl);

      // remove local file after upload
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      text: text || "",
      content: contentUrl,
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
