import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message } from "@/types";
import { useAuthStore } from "@/store/auth";

const SOCKET_URL = "https://chatify-server-dd9f.onrender.com";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  unreadChats: Set<string>;
  activityUsers: Map<string, Map<string, { name: string; activity: string }>>; // chatId -> Map(userId -> {name, activity})
  queryClient: QueryClient | null;

  connect: (token: string, queryClient: QueryClient, deviceId: string) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, text: string, replyTo?: string) => void;
  sendActivity: (
    chatId: string,
    activity: "typing" | "recording" | "none",
  ) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  unreadChats: new Set(),
  activityUsers: new Map(),
  queryClient: null,

  connect: (token, queryClient, deviceId) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token, deviceId },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      set({ isConnected: false });
    });

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.add(userId);
        return { onlineUsers: next };
      });
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.delete(userId);
        return { onlineUsers: next };
      });
    });

    socket.on("new-message", (message: Message) => {
      const { queryClient } = get();
      if (!queryClient) return;

      const senderId =
        typeof message.sender === "string"
          ? message.sender
          : message.sender._id;

      // Update message history
      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        if (!old) return [message];
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });

      // Update chats list
      queryClient.setQueryData<Chat[]>(["chats"], (old) => {
        return old?.map((c) =>
          c._id === message.chat
            ? {
                ...c,
                lastMessage: { ...message, sender: senderId },
                lastMessageAt: message.createdAt,
              }
            : c,
        );
      });

      // Mark unread if not the sender
      const currentUserId = useAuthStore.getState().user?._id;
      if (senderId !== currentUserId) {
        set((state) => ({
          unreadChats: new Set([...state.unreadChats, message.chat]),
        }));
      }
    });

    socket.on("activity", ({ userId, userName, chatId, activity }) => {
      set((state) => {
        const activityUsers = new Map(state.activityUsers);
        const chatActivity = new Map(activityUsers.get(chatId) || new Map());

        if (activity !== "none") {
          chatActivity.set(userId, { name: userName || "Someone", activity });
        } else {
          chatActivity.delete(userId);
        }

        if (chatActivity.size > 0) {
          activityUsers.set(chatId, chatActivity);
        } else {
          activityUsers.delete(chatId);
        }

        return { activityUsers };
      });
    });

    socket.on("user-updated", () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    socket.on("message-reaction", ({ messageId, reactions }) => {
      const { queryClient } = get();
      if (!queryClient) return;

      queryClient.setQueriesData<Message[]>(
        { queryKey: ["messages"] },
        (old) => {
          if (!old) return old;
          return old.map((m) =>
            m._id === messageId ? { ...m, reactions } : m,
          );
        },
      );
    });

    socket.on("session-expired", () => {
      useAuthStore.getState().logout();
      socket.disconnect();
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },

  joinChat: (chatId) => {
    get().socket?.emit("join-chat", chatId);
    set((state) => {
      const next = new Set(state.unreadChats);
      next.delete(chatId);
      return { unreadChats: next };
    });
  },

  leaveChat: (chatId) => {
    get().socket?.emit("leave-chat", chatId);
  },

  sendMessage: (chatId, text, replyTo) => {
    get().socket?.emit("send-message", { chatId, text, replyTo });
  },

  sendActivity: (chatId, activity) => {
    get().socket?.emit("activity", { chatId, activity });
  },
}));
