import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";
import type { Message } from "@/types";

export const useMessages = (chatId: string) => {
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async (): Promise<Message[]> => {
      const { data } = await apiWithAuth<Message[]>({
        method: "GET",
        url: `/messages/chat/${chatId}`,
      });
      return data;
    },
    enabled: !!chatId,
  });
};

export const useSendMessageWithContent = () => {
  const { apiWithAuth } = useApi();

  return async (chatId: string, text: string, file?: FormData) => {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("text", text);
    if (file) formData.append("content", file as any); // use 'content' to match server

    const { data } = await apiWithAuth<Message>({
      method: "POST",
      url: `/messages/send`, // match backend route (prefix `/api` depends on apiWithAuth base)
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  };
};