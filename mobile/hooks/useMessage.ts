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
  const { apiWithAuth } = useApi();

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

    const { data } = await apiWithAuth<Message>({
      method: "POST",
      url: "/messages/send",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };
};

export const useUpdateTextMessage = () => {
  const { apiWithAuth } = useApi();

  return async (messageId: string, text: string) => {
    const { data } = await apiWithAuth<Message>({
      method: "PUT",
      url: `/messages/update/${messageId}`,
      data: { text },
    });
    return data;
  };
};

export const useDeleteMessage = () => {
  const { apiWithAuth } = useApi();

  return async (messageId: string) => {
    const { data } = await apiWithAuth<{ message: string }>({
      method: "DELETE",
      url: `/messages/delete/${messageId}`,
    });
    return data;
  };
};
