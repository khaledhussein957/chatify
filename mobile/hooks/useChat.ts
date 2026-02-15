import { useApi } from "@/lib/axios";
import type { Chat } from "@/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

export const useChats = () => {
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await apiWithAuth<Chat[]>({
        method: "GET",
        url: "/chats",
      });
      return data;
    },
  });
};

export const useGetOrCreateChat = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { data } = await apiWithAuth<Chat>({
        method: "POST",
        url: `/chats/with/${participantId}`,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useCreateGroupChat = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      participantIds,
    }: {
      name: string;
      participantIds: string[];
    }) => {
      const { data } = await apiWithAuth<Chat>({
        method: "POST",
        url: "/chats/with/group",
        data: { name, participantIds },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useAddMember = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      memberId,
    }: {
      chatId: string;
      memberId: string;
    }) => {
      await apiWithAuth({
        method: "POST",
        url: `/chats/${chatId}/add-member`,
        data: { memberId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useUpdateGroupAvatar = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async ({
      chatId,
      uri,
      type,
      name,
    }: {
      chatId: string;
      uri: string;
      type: string;
      name: string;
    }) => {
      const formData = new FormData();
      const fileUri =
        Platform.OS === "android" ? uri : uri.replace("file://", "");

      // @ts-ignore
      formData.append("groupImage", {
        uri: fileUri,
        type,
        name: name || "groupImage.jpg",
      });

      const { data } = await apiWithAuth<{
        message: string;
        groupImage: string;
      }>({
        method: "PUT",
        url: `/chats/${chatId}/update-group-avatar`,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      });
      return data;
    },
  });
};

export const useUpdateGroupName = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, name }: { chatId: string; name: string }) => {
      await apiWithAuth({
        method: "PUT",
        url: `/chats/${chatId}/update-group-name`,
        data: { name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useLeaveGroupChat = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      await apiWithAuth({
        method: "DELETE",
        url: `/chats/${chatId}/leave`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useRemoveMemberFromGroup = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      memberId,
    }: {
      chatId: string;
      memberId: string;
    }) => {
      await apiWithAuth({
        method: "DELETE",
        url: `/chats/${chatId}/remove-member`,
        data: { memberId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useDeleteChat = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      await apiWithAuth({
        method: "DELETE",
        url: `/chats/${chatId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
