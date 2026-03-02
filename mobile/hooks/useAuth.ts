import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";

// --- Auth callback (optional) ---
export const useAuthCallback = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<User>({
        method: "POST",
        url: "/auth/callback",
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "callback" },
      });
    },
  });
};

// ----------------------
// Current user
// ----------------------
export const useCurrentUser = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await apiWithAuth<User>({
        method: "GET",
        url: "/auth/me",
      });
      return data;
    },
    enabled: !!token,
  });
};

// ----------------------
// Register user
// ----------------------
export const useUserRegister = () => {
  const { api } = useApi();

  return useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: async (userData: { phone: string }) => {
      const { data } = await api<{
        message: string;
        userId: string;
        userExists?: boolean;
        user?: { name: string; email: string; avatar?: string };
      }>({
        method: "POST",
        url: "/auth/register",
        data: userData,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "register" },
      });
    },
  });
};

// ----------------------
// Verify code
// ----------------------
export const useVerifyCode = () => {
  const { api } = useApi();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["auth", "verifyCode"],
    mutationFn: async (userData: {
      phone: string;
      code: string;
      deviceId: string;
    }) => {
      const { data } = await api<{
        token: string;
        user: User;
        profileCompleted: boolean;
      }>({
        method: "POST",
        url: "/auth/verify-code",
        data: userData,
      });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "verify-code" },
      });
    },
  });
};

// ----------------------
// Resend code
// ----------------------
export const useResendCode = () => {
  const { api } = useApi();

  return useMutation({
    mutationKey: ["auth", "resendCode"],
    mutationFn: async (userData: { phone: string }) => {
      const { data } = await api<{ message: string }>({
        method: "POST",
        url: "/auth/resend-code",
        data: userData,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "resend-code" },
      });
    },
  });
};

//
export const useCompleteProfile = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async (params: Partial<{ name: string; email: string }>) => {
      const { data } = await apiWithAuth<{ user: User; message: string }>({
        method: "PUT",
        url: "/auth/complete-profile",
        data: params,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "complete-profile" },
      });
    },
  });
};

export const useCreatePassword = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await apiWithAuth({
        method: "POST",
        url: "/auth/create-password",
        data: params,
      });
      return data;
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { area: "auth", action: "create-password" },
      });
    },
  });
};

//
// Logout
//
export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
  };
};
