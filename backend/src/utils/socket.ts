import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import Status from "../models/status.model";
import ENV from "../configs/env";
import { sendPushNotification } from "./expo";

// store online users in memory: userId -> { deviceId -> Set<socketIds> }
export const onlineUsers: Map<string, Map<string, Set<string>>> = new Map();

export let io: SocketServer;

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081",
    "http://192.168.8.61:9000",
    "http://192.168.8.61:8081",
  ].filter(Boolean) as string[];

  io = new SocketServer(httpServer, { cors: { origin: "*" } });

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
    const deviceId = socket.handshake.auth.deviceId || "unknown";

    // Online users
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    const userDevices =
      onlineUsers.get(userId) ?? new Map<string, Set<string>>();
    const deviceSockets = userDevices.get(deviceId) ?? new Set<string>();
    deviceSockets.add(socket.id);
    userDevices.set(deviceId, deviceSockets);
    onlineUsers.set(userId, userDevices);

    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);
    socket.join(`user:${userId}:device:${deviceId}`); // User-scoped device room

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

          // Get sender name for push notification
          const sender = await User.findById(userId).select("name");
          const senderName = sender?.name || "Someone";

          // Emit to participants not currently in the chat room + send push to offline
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

              // Check if user is offline and send push notification
              const userDevices = onlineUsers.get(participantStr);
              if (!userDevices || userDevices.size === 0) {
                // User is offline, send push notification
                const participant =
                  await User.findById(participantStr).select("pushToken");
                if (participant?.pushToken) {
                  await sendPushNotification({
                    to: participant.pushToken,
                    title: chat.isGroupChat
                      ? chat.name || "Group Chat"
                      : senderName,
                    body: chat.isGroupChat
                      ? `${senderName}: ${text.substring(0, 100)}`
                      : text.substring(0, 100),
                    data: {
                      type: "message",
                      chatId,
                      senderId: userId,
                    },
                  });
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

    // --- Call Events ---

    socket.on(
      "call-user",
      async (data: { chatId: string; isGroup: boolean }) => {
        try {
          const { chatId, isGroup } = data;
          const callerId = userId;

          const chat = await Chat.findById(chatId).populate(
            "participants",
            "name avatar",
          );
          if (!chat) return;

          const callerName =
            (
              chat.participants.find(
                (p: any) => p._id.toString() === callerId,
              ) as any
            )?.name || "Unknown";

          // Notify participants
          for (const participant of chat.participants) {
            const partId = (participant as any)._id.toString();
            if (partId === callerId) continue;

            const userDevices = onlineUsers.get(partId);
            if (userDevices && userDevices.size > 0) {
              // User is online, emit socket event
              const userRoom = `user:${partId}`;
              io.to(userRoom).emit("incoming-call", {
                chatId,
                callerId,
                callerName,
                isGroup,
              });
            } else {
              // User is offline, send Push Notification
              // We need the push token. identifying it might require a User query if not in 'participant'
              // But 'participant' is populated with name/avatar only.
              // Let's fetch the user to get pushToken if needed, or better, populate pushToken in chat query?
              // For now, let's fetch user again to be safe and get pushToken.
              const user = await User.findById(partId).select("pushToken");
              if (user?.pushToken) {
                await sendPushNotification({
                  to: user.pushToken,
                  title: isGroup
                    ? `Group Call from ${callerName}`
                    : "Incoming Call",
                  body: `${callerName} is calling you...`,
                  data: {
                    type: "call",
                    chatId,
                    callerName,
                    isGroup,
                  },
                });
              }
            }
          }
        } catch (err) {
          console.error("Error in call-user:", err);
        }
      },
    );

    socket.on("answer-call", (data: { chatId: string }) => {
      socket.join(`call:${data.chatId}`);
    });

    socket.on("reject-call", (data: { chatId: string; callerId: string }) => {
      // Notify the caller that this specific user rejected
      io.to(`user:${data.callerId}`).emit("call-rejected", {
        userId,
        chatId: data.chatId,
      });
    });

    // Handle accept-call: join call room and broadcast acceptance
    socket.on("accept-call", async (data: { chatId: string }) => {
      socket.join(`call:${data.chatId}`);

      // Broadcast to all users in the call room that this user accepted
      io.to(`call:${data.chatId}`).emit("call-accepted", {
        userId,
        chatId: data.chatId,
      });

      // Also emit to all participants in the chat for the caller who initiated
      const chat = await Chat.findById(data.chatId);
      if (chat) {
        for (const participant of chat.participants) {
          const partId = participant.toString();
          if (partId !== userId) {
            io.to(`user:${partId}`).emit("call-accepted", {
              userId,
              chatId: data.chatId,
            });
          }
        }
      }
    });

    socket.on("end-call", async (data: { chatId: string }) => {
      // Notify everyone in the call room
      io.to(`call:${data.chatId}`).emit("call-ended", {
        userId,
        chatId: data.chatId,
      });

      // Also notify all chat participants directly (for those not in call room)
      const chat = await Chat.findById(data.chatId);
      if (chat) {
        for (const participant of chat.participants) {
          const partId = participant.toString();
          if (partId !== userId) {
            io.to(`user:${partId}`).emit("call-ended", {
              userId,
              chatId: data.chatId,
            });
          }
        }
      }

      socket.leave(`call:${data.chatId}`);
    });

    socket.on(
      "webrtc-offer",
      (data: { targetUserId: string; sdp: any; chatId: string }) => {
        io.to(`user:${data.targetUserId}`).emit("webrtc-offer", {
          senderId: userId,
          sdp: data.sdp,
          chatId: data.chatId,
        });
      },
    );

    socket.on(
      "webrtc-answer",
      (data: { targetUserId: string; sdp: any; chatId: string }) => {
        io.to(`user:${data.targetUserId}`).emit("webrtc-answer", {
          senderId: userId,
          sdp: data.sdp,
          chatId: data.chatId,
        });
      },
    );

    socket.on(
      "ice-candidate",
      (data: { targetUserId: string; candidate: any; chatId: string }) => {
        io.to(`user:${data.targetUserId}`).emit("ice-candidate", {
          senderId: userId,
          candidate: data.candidate,
          chatId: data.chatId,
        });
      },
    );

    // Disconnect
    socket.on("disconnect", () => {
      const userDevices = onlineUsers.get(userId);
      if (!userDevices) return;

      const deviceSockets = userDevices.get(deviceId);
      if (deviceSockets) {
        deviceSockets.delete(socket.id);
        if (deviceSockets.size === 0) {
          userDevices.delete(deviceId);
        }
      }

      if (userDevices.size === 0) {
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
        onlineUsers.set(userId, userDevices);
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

/**
 * Logout all other devices for a user
 */
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
