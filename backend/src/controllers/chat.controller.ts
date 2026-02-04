import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import Chat from "../models/chat.model";
import { Types } from "mongoose";

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
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId,
      );

      return {
        _id: chat._id,
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
