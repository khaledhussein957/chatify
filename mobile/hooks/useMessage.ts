import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";
import type { Message } from "@/types";
import * as Sentry from "@sentry/react-native";

export const useMessages = (chatId: string) => {
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async (): Promise<Message[]> => {
      const { data } = await apiWithAuth<Message[]>({
        method: "GET",
        url: `/messages/${chatId}`,
      });
      return data;
    },
    enabled: !!chatId,
  });
};

type FileUpload = {
  uri: string;
  type: string;
  name: string;
};

export const useSendMessage = () => {
  const { apiWithAuth } = useApi();

  return async (
    chatId: string,
    text: string,
    file?: FileUpload,
    replyTo?: string,
  ) => {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("text", text || "");
    if (replyTo) formData.append("replyTo", replyTo);

    if (file) {
      const fileUri =
        Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
      // @ts-ignore
      formData.append("content", {
        uri: fileUri,
        name: file.name || "media.jpg",
        type: file.type,
      });
    }

    try {
      const { data } = await apiWithAuth<Message>({
        method: "POST",
        url: "/messages/send",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "message", action: "send" },
        extra: { chatId, hasFile: !!file },
      });
      throw error;
    }
  };
};

export const useSendVoiceMessage = () => {
  const { apiWithAuth } = useApi();

  return async (chatId: string, file: FileUpload, duration: number) => {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("duration", duration.toString());

    const fileUri =
      Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
    // @ts-ignore
    formData.append("content", {
      uri: fileUri,
      name: file.name || "voice.m4a",
      type: file.type,
    } as any);

    try {
      const { data } = await apiWithAuth<Message>({
        method: "POST",
        url: "/messages/voice",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "message", action: "send-voice" },
        extra: { chatId, duration },
      });
      throw error;
    }
  };
};

export const useUpdateTextMessage = () => {
  const { apiWithAuth } = useApi();

  return async (messageId: string, text: string) => {
    try {
      const { data } = await apiWithAuth<Message>({
        method: "PUT",
        url: `/messages/update/${messageId}`,
        data: { text },
      });
      return data;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "message", action: "update" },
        extra: { messageId },
      });
      throw error;
    }
  };
};

export const useDeleteMessage = () => {
  const { apiWithAuth } = useApi();

  return async (messageId: string) => {
    try {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "DELETE",
        url: `/messages/delete/${messageId}`,
      });
      return data;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "message", action: "delete" },
        extra: { messageId },
      });
      throw error;
    }
  };
};

export const useReactToMessage = () => {
  const { apiWithAuth } = useApi();

  return async (messageId: string, emoji: string) => {
    try {
      const { data } = await apiWithAuth({
        method: "POST",
        url: `/messages/react/${messageId}`,
        data: { emoji },
      });
      return data;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "message", action: "react" },
        extra: { messageId, emoji },
      });
      throw error;
    }
  };
};
