import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";
import type { Message } from "@/types";
import { useAuthStore } from "@/store/auth";

const API_URL = "http://192.168.8.55:9000/api";

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

export const useSendMessageWithContent = () => {
  const token = useAuthStore((state) => state.token);

  return async (chatId: string, text: string, file?: FileUpload) => {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("text", text || "");

    if (file) {
      // @ts-ignore
      formData.append("content", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });
    }

    const response = await fetch(`${API_URL}/messages/send`, {
      method: "POST",
      body: formData,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // "Content-Type": "multipart/form-data" // Do NOT set this, fetch adds boundary automatically
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed server response:", errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  };
};
