import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

import Message from "../models/message.model";
import Chat from "../models/chat.model";
import User from "../models/user.model";
import ENV from "../configs/env";

// store online users in memory: userId -> socketIds
export const onlineUsers: Map<string, Set<string>> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081", // Expo mobile
  ].filter(Boolean) as string[];

  const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

  // JWT auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: token missing"));

    try {
      if (!ENV.JWT_SECRET) return next(new Error("Server misconfiguration"));

      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };

      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error("User not found"));

      socket.data.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // send list of currently online users to the newly connected client
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // store user in the onlineUsers map
    const sockets = onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);

    // notify others that this current user is online
    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);

    socket.on("join-chat", async (chatId: string) => {
      const chat = await Chat.findOne({ _id: chatId, participants: userId });
      if (!chat) {
        socket.emit("socket-error", { message: "Chat not found" });
        return;
      }
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;

          const chat = await Chat.findOne({ _id: chatId, participants: userId });
          if (!chat) {
            socket.emit("socket-error", { message: "Chat not found" });
            return;
          }

          if (!text || text.trim() === "") {
            socket.emit("socket-error", { message: "Message text cannot be empty" });
            return;
          }

          const message = await Message.create({
            chat: chatId,
            sender: userId,
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("sender", "name avatar");

          // emit to participants' personal rooms, excluding those in the chat room
          for (const participantId of chat.participants) {
            const userRoom = `user:${participantId}`;
            const chatRoom = `chat:${chatId}`;
            const userRoomSockets = io.sockets.adapter.rooms.get(userRoom);
            const chatRoomSockets = io.sockets.adapter.rooms.get(chatRoom);

            if (userRoomSockets) {
              for (const socketId of userRoomSockets) {
                if (!chatRoomSockets?.has(socketId)) {
                  io.to(socketId).emit("new-message", message);
                }
              }
            }
          }
        } catch (error) {
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      const typingPayload = {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

      try {
        const chat = await Chat.findById(data.chatId);
        if (chat) {
          const otherParticipantId = chat.participants.find(
            (p: any) => p.toString() !== userId
          );
          if (otherParticipantId) {
            socket.to(`user:${otherParticipantId}`).emit("typing", typingPayload);
          }
        }
      } catch (error) {
        // silently fail
      }
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user-offline", { userId });
      } else {
        onlineUsers.set(userId, sockets);
      }
    });
  });

  return io;
};
