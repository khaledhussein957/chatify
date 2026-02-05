import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import Chat from "../models/chat.model";
import { Types } from "mongoose";
import Message from "../models/message.model";
import { io } from "../utils/socket";
import cloudinary from "../configs/cloudinary";

export const getOrCreateChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { participantId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!participantId || !Types.ObjectId.isValid(participantId.toString())) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    if (userId === participantId) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    // Sort participants for consistent ordering
    const sortedParticipants = [userId, participantId].sort();

    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: sortedParticipants, $size: 2 },
    })
      .populate("participants", "name email avatar")
      .populate("lastMessage");

    if (!chat) {
      chat = await Chat.create({
        participants: sortedParticipants,
      });
      chat = await chat.populate("participants", "name email avatar");
    }

    // Get the other participant's details
    const otherParticipant = chat.participants.find(
      (p: any) => p._id.toString() !== userId,
    );

    res.json({
      _id: chat._id,
      participant: otherParticipant ?? null,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    console.log(`Error in get or create chat: ${error}`);
    next(error);
  }
};

export const getOrCreateGroupChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { name, participantIds } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !Array.isArray(participantIds)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Remove duplicates & ensure creator is included
    const uniqueParticipants = Array.from(new Set([...participantIds, userId]));

    if (uniqueParticipants.length < 3) {
      return res
        .status(400)
        .json({ message: "Group chat must have at least 3 participants" });
    }

    const groupImage = name.charAt(0).toUpperCase();

    const groupChat = await Chat.create({
      name,
      participants: uniqueParticipants,
      isGroupChat: true,
      admins: [userId],
      groupImage,
    });

    const populatedGroupChat = await groupChat.populate(
      "participants",
      "name email avatar",
    );

    res.status(201).json(populatedGroupChat);
  } catch (error) {
    console.log(`Error creating group chat: ${error}`);
    next(error);
  }
};

export const getChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    const formattedChats = chats.map((chat) => {
      if (chat.isGroupChat) {
        return {
          _id: chat._id,
          isGroupChat: true,
          name: chat.name,
          groupImage: chat.groupImage,
          participants: chat.participants,
          admins: chat.admins,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt,
          createdAt: chat.createdAt,
        };
      }

      // Private chat
      const otherParticipant = chat.participants.find(
        (p: any) => p._id.toString() !== userId,
      );

      return {
        _id: chat._id,
        isGroupChat: false,
        participant: otherParticipant ?? null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.log(`Error in get chats: ${error}`);
    next(error);
  }
};

export const deleteChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!chatId || !Types.ObjectId.isValid(chatId.toString()))
      return res.status(400).json({ message: "Invalid chat ID" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.participants.some((p: any) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (chat.isGroupChat && !chat.admins.includes(userId as any)) {
      return res
        .status(403)
        .json({ message: "Only admins can delete group chat" });
    }

    const messages = await Message.find({
      chat: new Types.ObjectId(chatId as any),
    });

    for (const message of messages) {
      if (message.contentPublicId) {
        try {
          await cloudinary.uploader.destroy(message.contentPublicId, {
            resource_type: "auto",
          });
        } catch (err) {
          console.error("Failed to delete Cloudinary content:", err);
        }
      }
    }

    await Message.deleteMany({ chat: new Types.ObjectId(chatId as any) });

    await chat.deleteOne();

    if (io) {
      chat.participants.forEach((p: any) => {
        io.to(`user:${p.toString()}`).emit("chat-deleted", { chatId });
      });
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.log(`Error in delete chat: ${error}`);
    next(error);
  }
};
