import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import Message from "../models/message.model";
import Chat from "../models/chat.model";
import cloudinary from "../configs/cloudinary";
import path from "path";
import fs from "fs";

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
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    let contentUrl: string | undefined = undefined;

    // if a file was uploaded via multer, upload it to Cloudinary
    if (req.file) {
      const filePath = path.resolve(req.file.path);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: "chatify",
        resource_type: "auto",
      });

      contentUrl = uploadResult.secure_url as string;

      // remove local file after upload
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // non-fatal
      }
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      text: text || "",
      ...(contentUrl ? { content: contentUrl } : {}),
    });

    await message.save();

    chat.lastMessage = message._id as any;
    chat.lastMessageAt = new Date();
    await chat.save();

    await (message as any).populate("sender", "name avatar");

    res.status(201).json(message);
  } catch (error) {
    console.log(`Error in send message: ${error}`);
    next(error);
  }
};
