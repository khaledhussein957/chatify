import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

import Message from "../models/message.model";
import Chat from "../models/chat.model";
import User from "../models/user.model";
import ENV from "../configs/env";

// store online users in memory: userId -> socketIds
export const onlineUsers: Map<string, Set<string>> = new Map();

export let io: SocketServer;

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081",
    "http://192.168.8.55:9000",
    "http://192.168.8.55:8081",
  ].filter(Boolean) as string[];

  io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

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

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    // Notify the new client about current online users
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // Add to onlineUsers map
    const sockets = onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);

    // Notify all others the user is online
    socket.broadcast.emit("user-online", { userId });

    // Join personal room
    socket.join(`user:${userId}`);

    // Join a chat (private or group)
    socket.on("join-chat", async (chatId: string) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found" });
          return;
        }

        if (!chat.participants.some((p) => p.toString() === userId)) {
          socket.emit("socket-error", { message: "You are not in this chat" });
          return;
        }

        socket.join(`chat:${chatId}`);
        socket.to(`chat:${chatId}`).emit("user-joined", {
          userId,
          chatId,
          isGroupChat: chat.isGroupChat,
        });
        console.log(`User ${userId} joined chat ${chatId}`);
      } catch (err) {
        console.error("Error joining chat:", err);
        socket.emit("socket-error", { message: "Failed to join chat" });
      }
    });

    // Leave chat
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // Send message to a chat (supports group)
    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;
          if (!text || text.trim() === "") {
            socket.emit("socket-error", { message: "Message cannot be empty" });
            return;
          }

          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });
          if (!chat) {
            socket.emit("socket-error", { message: "Chat not found" });
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

          // Emit to all participants in the chat room
          io.to(`chat:${chatId}`).emit("new-message", message);

          // Emit to participants in personal rooms (if they are not in chat room)
          for (const participantId of chat.participants) {
            const participantStr = participantId.toString();
            if (participantStr !== userId) {
              const userRoom = `user:${participantStr}`;
              const chatRoomSockets = io.sockets.adapter.rooms.get(
                `chat:${chatId}`,
              );
              const userRoomSockets = io.sockets.adapter.rooms.get(userRoom);

              if (userRoomSockets) {
                for (const socketId of userRoomSockets) {
                  if (!chatRoomSockets?.has(socketId)) {
                    io.to(socketId).emit("new-message", message);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error sending message:", err);
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      },
    );

    // Typing indicator for private & group chats
    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      const { chatId, isTyping } = data;
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const user = await User.findById(userId).select("name");
        const payload = { userId, userName: user?.name, chatId, isTyping };
        chat.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== userId) io.to(`user:${pid}`).emit("typing", payload);
        });
      } catch (err) {
        console.error("Typing error:", err);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        // Notify all chats the user belongs to
        Chat.find({ participants: userId })
          .then((chats) => {
            chats.forEach((chat) => {
              io.to(`chat:${chat._id}`).emit("user-offline", { userId });
            });
          })
          .catch((err) => console.error("Disconnect notification error:", err));
      } else {
        onlineUsers.set(userId, sockets);
      }
    });
  });

  return io;
};
