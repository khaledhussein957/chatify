import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import Status from "../models/status.model";
import { sendPushNotification } from "./expo";
import ENV from "../configs/env";

export const onlineUsers = new Map<string, Set<string>>();
export let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));

    try {
      if (!ENV.JWT_SECRET) return next(new Error("Server misconfiguration"));
      const decoded = jwt.verify(token, ENV.JWT_SECRET!) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    // --- Online Status ---
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });
    socket.broadcast.emit("user-online", { userId });

    // --- Chat Room Management ---
    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // --- Send Message ---
    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;
          if (!text?.trim()) return;

          const message = await Message.create({
            chat: chatId,
            sender: userId,
            type: "text",
            text: text.trim(),
          });

          // Update Chat metadata
          const chat = await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          }).populate("participants", "pushToken");

          if (!chat) return;

          await message.populate("sender", "name avatar");
          io.to(`chat:${chatId}`).emit("new-message", message);

          // Handle offline push notifications
          const sender = await User.findById(userId).select("name");
          const senderName = sender?.name || "Someone";

          for (const participant of chat.participants as any[]) {
            const pid = participant._id.toString();
            if (pid === userId) continue;

            // Check if participant is offline (no active sockets)
            if (!onlineUsers.has(pid) || onlineUsers.get(pid)!.size === 0) {
              if (participant.pushToken) {
                await sendPushNotification({
                  to: participant.pushToken,
                  title: chat.isGroupChat
                    ? chat.name || "Group Chat"
                    : senderName,
                  body: text.substring(0, 100),
                  data: { type: "message", chatId },
                });
              }
            }
          }
        } catch (err) {
          console.error("Socket send-message error:", err);
        }
      },
    );

    // --- Activity & Status ---
    socket.on(
      "activity",
      async (data: { chatId: string; activity: string }) => {
        const user = await User.findById(userId).select("name");
        socket.to(`chat:${data.chatId}`).emit("activity", {
          userId,
          userName: user?.name,
          chatId: data.chatId,
          activity: data.activity,
        });
      },
    );

    socket.on("view-status", async (statusId: string) => {
      try {
        const status = await Status.findById(statusId);
        if (
          status &&
          status.user.toString() !== userId &&
          !status.viewers.includes(userId)
        ) {
          status.viewers.push(userId);
          await status.save();
          io.to(`user:${status.user}`).emit("status-viewed", {
            statusId,
            viewerId: userId,
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user-offline", { userId });
        }
      }
    });
  });

  return io;
};

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

export const logoutOtherDevices = (userId: string, currentDeviceId: string) => {
  if (!io) return;

  const userDevices = onlineUsers.get(userId);
  if (!userDevices) return;

  for (const [deviceId, socketIds] of userDevices.entries()) {
    if (deviceId !== currentDeviceId) {
      const deviceRoom = `user:${userId}:device:${deviceId}`;
      io.to(deviceRoom).emit("session-expired", {
        message: "You have logged in from another device.",
      });
      io.in(deviceRoom).disconnectSockets(true);
      userDevices.delete(deviceId);
    }
  }

  if (userDevices.size === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, userDevices);
  }
};
