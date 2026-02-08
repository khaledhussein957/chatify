import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import Status from "../models/status.model";
import ENV from "../configs/env";

// store online users in memory: userId -> socketIds
export const onlineUsers: Map<string, Set<string>> = new Map();

export let io: SocketServer;

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081",
    "http://192.168.8.61:9000",
    "http://192.168.8.61:8081",
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

    // Online users
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });
    const sockets = onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);
    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);

    // Join chat
    socket.on("join-chat", async (chatId: string) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat)
          return socket.emit("socket-error", { message: "Chat not found" });
        if (!chat.participants.some((p) => p.toString() === userId)) {
          return socket.emit("socket-error", {
            message: "You are not in this chat",
          });
        }
        socket.join(`chat:${chatId}`);
        socket.to(`chat:${chatId}`).emit("user-joined", {
          userId,
          chatId,
          isGroupChat: chat.isGroupChat,
        });
      } catch (err) {
        console.error("Join chat error:", err);
        socket.emit("socket-error", { message: "Failed to join chat" });
      }
    });

    // Leave chat
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      socket.to(`chat:${chatId}`).emit("user-left", { userId, chatId });
    });

    // Send message (text only)
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
            type: "text",
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("sender", "name avatar");

          // Emit to chat room
          io.to(`chat:${chatId}`).emit("new-message", message);

          // Emit to participants not currently in the chat room
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

    // Activity indicator (typing, recording, etc.)
    socket.on(
      "activity",
      async (data: {
        chatId: string;
        activity: "typing" | "recording" | "none";
      }) => {
        try {
          const { chatId, activity } = data;
          const chat = await Chat.findById(chatId);
          if (!chat) return;
          const user = await User.findById(userId).select("name");
          const payload = {
            userId,
            userName: user?.name,
            chatId,
            activity,
          };
          socket.to(`chat:${chatId}`).emit("activity", payload);
        } catch (err) {
          console.error("Activity error:", err);
        }
      },
    );

    // View status
    socket.on("view-status", async (statusId: string) => {
      try {
        const status = await Status.findById(statusId);
        if (!status) return;

        // Don't count owner viewing their own status
        if (status.user.toString() === userId) return;

        if (!status.viewers.includes(userId)) {
          status.viewers.push(userId);
          await status.save();

          // Notify owner in real-time
          io.to(`user:${status.user.toString()}`).emit("status-viewed", {
            statusId,
            viewerId: userId,
          });
        }
      } catch (err) {
        console.error("Error handling view-status:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        Chat.find({ participants: userId })
          .then((chats) => {
            chats.forEach((chat) =>
              io.to(`chat:${chat._id}`).emit("user-offline", { userId }),
            );
          })
          .catch((err) =>
            console.error("Disconnect offline-broadcast error:", err),
          );
      } else {
        onlineUsers.set(userId, sockets);
      }
    });
  });

  return io;
};

/**
 * Forcefully disconnects all sockets for a given user and clears online status.
 */
export const forceDisconnectUser = (userId: string) => {
  if (!io) return;

  const userRoom = `user:${userId}`;
  io.to(userRoom).emit("user-deleted", {
    message: "Your account has been deleted.",
  });
  io.in(userRoom).disconnectSockets(true);

  // cleanup in-memory online state if any somehow remains
  onlineUsers.delete(userId);
};
