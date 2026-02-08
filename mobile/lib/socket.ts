import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message, MessageSender, Status } from "@/types";
import { useAuthStore } from "@/store/auth";

const SOCKET_URL = "https://chatify-server-hazel.vercel.app/api";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  activityUsers: Map<string, Map<string, { name: string; activity: string }>>; // chatId -> Map(userId -> {name, activity})
  unreadChats: Set<string>;
  currentChatId: string | null;
  queryClient: QueryClient | null;

  connect: (token: string, queryClient: QueryClient, deviceId: string) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (
    chatId: string,
    text: string,
    currentUser: MessageSender,
  ) => void;
  sendActivity: (
    chatId: string,
    activity: "typing" | "recording" | "none",
  ) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  activityUsers: new Map(),
  unreadChats: new Set(),
  currentChatId: null,
  queryClient: null,

  connect: (token, queryClient, deviceId) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token, deviceId } });

    socket.on("connect", () => {
      console.log("Socket connected, id:", socket.id);
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnect", socket.id);
      set({ isConnected: false });
    });

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      console.log("Received online-users:", userIds);
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers: onlineUsers };
      });
    });

    socket.on("socket-error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    socket.on("new-message", (message: Message) => {
      const senderId =
        typeof message.sender === "string"
          ? message.sender
          : message.sender._id;
      const { currentChatId } = get();

      // add message to the chat's message list, replacing optimistic messages
      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        if (!old) return [message];
        // remove any optimistic messages (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });

      // Update chat's lastMessage directly for instant UI update
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                type: message.type,
                text: message.text,
                content: message.content,
                duration: message.duration,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
      });

      // mark as unread if not currently viewing this chat and message is from other user
      if (currentChatId !== message.chat) {
        const currentUserId = useAuthStore.getState().user?._id;
        if (senderId !== currentUserId) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, message.chat]),
          }));
        }
      }

      // clear activity indicator when message received
      set((state) => {
        const activityUsers = new Map(state.activityUsers);
        activityUsers.delete(message.chat);
        return { activityUsers };
      });
    });

    // Status events
    socket.on("new-status", (status: Status) => {
      console.log("Received new-status:", status._id);
      queryClient.setQueryData<Status[]>(["statuses"], (old) => {
        if (!old) return [status];
        if (old.some((s) => s._id === status._id)) return old;
        return [status, ...old];
      });
      if (status.user?._id) {
        queryClient.setQueryData<Status[]>(
          ["statuses", status.user._id],
          (old) => {
            if (!old) return [status];
            if (old.some((s) => s._id === status._id)) return old;
            return [status, ...old];
          },
        );
      }
    });

    socket.on(
      "status-viewed",
      ({ statusId, viewerId }: { statusId: string; viewerId: string }) => {
        console.log("Received status-viewed:", statusId);
        queryClient.setQueryData<Status[]>(["statuses"], (old) => {
          if (!old) return old;
          return old.map((s) =>
            s._id === statusId && !s.viewers.includes(viewerId)
              ? { ...s, viewers: [...s.viewers, viewerId] }
              : s,
          );
        });

        queryClient.setQueriesData<Status[]>(
          { queryKey: ["statuses"] },
          (old) => {
            if (!old) return old;
            return old.map((s) =>
              s._id === statusId && !s.viewers.includes(viewerId)
                ? { ...s, viewers: [...s.viewers, viewerId] }
                : s,
            );
          },
        );
      },
    );

    socket.on("status-deleted", ({ statusId }: { statusId: string }) => {
      console.log("Received status-deleted:", statusId);
      queryClient.setQueryData<Status[]>(["statuses"], (old) =>
        old?.filter((s) => s._id !== statusId),
      );
      queryClient.setQueriesData<Status[]>({ queryKey: ["statuses"] }, (old) =>
        old?.filter((s) => s._id !== statusId),
      );
    });

    socket.on(
      "activity",
      ({
        userId,
        userName,
        chatId,
        activity,
      }: {
        userId: string;
        userName: string;
        chatId: string;
        activity: "typing" | "recording" | "none";
      }) => {
        set((state) => {
          const activityUsers = new Map(state.activityUsers);
          const chatActivity = new Map(activityUsers.get(chatId) || new Map());

          if (activity !== "none") {
            chatActivity.set(userId, {
              name: userName || "Someone",
              activity,
            });
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
      },
    );

    socket.on("user-updated", ({ userId }: { userId: string }) => {
      console.log("Received user-updated for:", userId);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    socket.on("message-deleted", (messageId: string) => {
      console.log("Received message-deleted:", messageId);
      // Soft delete in the cache
      queryClient.setQueriesData<Message[]>(
        { queryKey: ["messages"] },
        (old) => {
          return old?.map((m) =>
            m._id === messageId ? { ...m, deleted: true, text: "" } : m,
          );
        },
      );
      // Also update chats list to refresh lastMessage if needed
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    socket.on(
      "message-updated",
      ({ messageId, text }: { messageId: string; text: string }) => {
        console.log("Received message-updated:", messageId);
        // Update specific message in the query data
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      },
    );

    socket.on("chat-deleted", ({ chatId }: { chatId: string }) => {
      console.log("Received chat-deleted:", chatId);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    socket.on("new-chat", ({ chatId }: { chatId: string }) => {
      console.log("Received new-chat:", chatId);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    socket.on("session-expired", ({ message }: { message: string }) => {
      console.log("Session expired:", message);
      useAuthStore.getState().logout();
      socket.disconnect();
      set({ isConnected: false });
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        onlineUsers: new Set(),
        activityUsers: new Map(),
        unreadChats: new Set(),
        currentChatId: null,
        queryClient: null,
      });
    }
  },
  joinChat: (chatId) => {
    const socket = get().socket;
    set((state) => {
      const unreadChats = new Set(state.unreadChats);
      unreadChats.delete(chatId);
      return { currentChatId: chatId, unreadChats: unreadChats };
    });

    if (socket?.connected) {
      socket.emit("join-chat", chatId);
    }
  },
  leaveChat: (chatId) => {
    const { socket } = get();
    set({ currentChatId: null });
    if (socket?.connected) {
      socket.emit("leave-chat", chatId);
    }
  },
  sendMessage: (chatId, text, currentUser) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) return;

    // optimistic updates
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      chat: chatId,
      sender: currentUser,
      type: "text",
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // add optimistic message immediately
    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    socket.emit("send-message", { chatId, text });

    const errorHandler = (error: { message: string }) => {
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
      socket.off("socket-error", errorHandler);
    };

    socket.once("socket-error", errorHandler);
  },

  sendActivity: (chatId, activity) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit("activity", { chatId, activity });
    }
  },
}));
