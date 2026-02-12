import { Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import type { Status, User } from "@/types";

// ----------------------
// Get all active statuses
// ----------------------
export const useStatuses = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      const { data } = await apiWithAuth<Status[]>({
        method: "GET",
        url: "/status",
      });
      return data;
    },
    enabled: !!token,
  });
};

// ----------------------
// Get statuses for a specific user
// ----------------------
export const useUserStatuses = (userId?: string) => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["statuses", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await apiWithAuth<Status[]>({
        method: "GET",
        url: `/status/${userId}`,
      });
      return data;
    },
    enabled: !!token && !!userId,
  });
};

// ----------------------
// Create a new status (text and/or media)
// ----------------------
export const useCreateStatus = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      text?: string;
      media?: {
        uri: string;
        type: string;
        name: string;
        duration?: number;
      };
    }) => {
      const formData = new FormData();

      if (params.text?.trim()) {
        formData.append("text", params.text.trim());
      }

      if (params.media) {
        const fileUri =
          Platform.OS === "android"
            ? params.media.uri
            : params.media.uri.replace("file://", "");

        // @ts-ignore
        formData.append("media", {
          uri: fileUri,
          type: params.media.type,
          name: params.media.name || "media.jpg",
        });

        if (typeof params.media.duration === "number") {
          formData.append("duration", String(params.media.duration));
        }
      }

      const { data } = await apiWithAuth<Status>({
        method: "POST",
        url: "/status",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      if (created?.user?._id) {
        queryClient.invalidateQueries({
          queryKey: ["statuses", created.user._id],
        });
      }
    },
  });
};

// ----------------------
// Mark a status as viewed
// ----------------------
export const useViewStatus = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string) => {
      const { data } = await apiWithAuth<{ viewers: string[] }>({
        method: "POST",
        url: `/status/${statusId}/view`,
      });
      return data;
    },
    onSuccess: (_, statusId) => {
      // Refresh statuses so viewer counts stay in sync
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "statuses" &&
          query.queryKey.length === 2,
      });
    },
  });
};

// ----------------------
// Mark a status as reacted
// ----------------------
export const useReactToStatus = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string) => {
      const { data } = await apiWithAuth<{
        message: string;
        reactionsCount: number;
        reacted: boolean;
      }>({
        method: "POST",
        url: `/status/${statusId}/react`,
      });
      return data;
    },
    onSuccess: (data, statusId) => {
      // Refresh statuses so viewer/reaction counts stay in sync
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "statuses" &&
          query.queryKey.length === 2,
      });
    },
  });
};

// ----------------------
// Delete a status
// ----------------------
export const useDeleteStatus = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string) => {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "DELETE",
        url: `/status/${statusId}`,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "statuses" &&
          query.queryKey.length === 2,
      });
    },
  });
};

// ----------------------
// Get detailed viewers for a status
// ----------------------
export const useStatusViewers = (statusId?: string) => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["status-viewers", statusId],
    queryFn: async () => {
      if (!statusId) return { viewers: [], reactions: [] };
      const { data } = await apiWithAuth<{
        viewers: User[];
        reactions: string[];
      }>({
        method: "GET",
        url: `/status/${statusId}/viewers`,
      });
      return data;
    },
    enabled: !!token && !!statusId,
  });
};
