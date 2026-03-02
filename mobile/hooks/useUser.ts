import { Platform } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@/types";
import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import * as Sentry from "@sentry/react-native";

// ----------------------
// Get all users
// ----------------------
export const useUsers = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await apiWithAuth<User[]>({
        method: "GET",
        url: "/users",
      });
      return data;
    },
    enabled: !!token,
  });
};

// ----------------------
// Change phone number
// ----------------------
export const useChangePhoneNumber = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async (params: { oldPhone: string; newPhone: string }) => {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "PUT",
        url: "/users/update-phone",
        data: params,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "user", action: "change-phone" },
      });
    },
  });
};

// ----------------------
// Update profile (name, email, etc.)
// ----------------------
export const useUpdateProfile = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async (params: Partial<{ name: string; email: string }>) => {
      const { data } = await apiWithAuth<{ user: User; message: string }>({
        method: "PUT",
        url: "/users/update-profile",
        data: params,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "user", action: "update-profile" },
      });
    },
  });
};

// ----------------------
// Update profile avatar
// ----------------------
export const useUpdateProfileAvatar = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async ({
      uri,
      type,
      name,
    }: {
      uri: string;
      type: string;
      name: string;
    }) => {
      const formData = new FormData();
      const fileUri =
        Platform.OS === "android" ? uri : uri.replace("file://", "");

      // @ts-ignore
      formData.append("avatar", {
        uri: fileUri,
        type,
        name: name || "avatar.jpg",
      });

      const { data } = await apiWithAuth<{
        message: string;
        avatar: string;
      }>({
        method: "PUT",
        url: "/users/update-profile-avatar",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      });
      return data;
    },
  });
};

// ----------------------
// Delete account
// ----------------------
export const useDeleteAccount = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "DELETE",
        url: "/users/delete-account",
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "user", action: "delete-account" },
      });
    },
  });
};
