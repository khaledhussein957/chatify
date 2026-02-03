import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@/types";
import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

// ----------------------
// Get all users
// ----------------------
export const useUsers = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

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
// Change password
// ----------------------
export const useChangePassword = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

  return useMutation({
    mutationFn: async (params: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "PUT",
        url: "/users/change-password",
        data: params,
      });
      return data;
    },
  });
};

// ----------------------
// Update profile (name, email, etc.)
// ----------------------
export const useUpdateProfile = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

  return useMutation({
    mutationFn: async (params: Partial<{ name: string; email: string }>) => {
      const { data } = await apiWithAuth<User>({
        method: "PUT",
        url: "/users/update-profile",
        data: params,
      });
      return data;
    },
  });
};

// ----------------------
// Update profile avatar
// ----------------------
export const useUpdateProfileAvatar = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

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
      formData.append("avatar", {
        uri,
        type,
        name,
      } as any);

      const { data } = await apiWithAuth<{
        message: string;
        avatar: string;
      }>({
        method: "PUT",
        url: "/users/update-profile-avatar",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};

// ----------------------
// Delete account
// ----------------------
export const useDeleteAccount = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<{ message: string }>({
        method: "DELETE",
        url: "/users/delete-account",
      });
      return data;
    },
  });
};
