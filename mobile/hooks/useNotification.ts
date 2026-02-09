import { useMutation, useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";
import type { Notification } from "@/types";

// get all notifications

export const useNotifications = () => {
  const { apiWithAuth } = useApi();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiWithAuth<Notification[]>({
        method: "GET",
        url: "/notifications",
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

export const useMarkAsRead = () => {
  const { apiWithAuth } = useApi();

  return useMutation<Notification, Error, string>({
    mutationKey: ["notifications"],
    mutationFn: async (id: string) => {
      const { data } = await apiWithAuth<Notification>({
        method: "PUT",
        url: `/notifications/${id}/read`,
      });
      return data;
    },
  });
};

export const useMarkAllAsRead = () => {
  const { apiWithAuth } = useApi();

  return useMutation<Notification, Error>({
    mutationKey: ["notifications"],
    mutationFn: async () => {
      const { data } = await apiWithAuth<Notification>({
        method: "PUT",
        url: `/notifications/read-all`,
      });
      return data;
    },
  });
};

export const useDeleteNotification = () => {
  const { apiWithAuth } = useApi();

  return useMutation<Notification, Error, string>({
    mutationKey: ["notifications"],
    mutationFn: async (id: string) => {
      const { data } = await apiWithAuth<Notification>({
        method: "DELETE",
        url: `/notifications/${id}`,
      });
      return data;
    },
  });
};
