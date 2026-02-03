import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// --- Auth callback (optional) ---
export const useAuthCallback = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<User>({
        method: "POST",
        url: "/auth/callback",
      });
      return data;
    },
  });
};

// ----------------------
// Current user
// ----------------------
export const useCurrentUser = () => {
  const token = useAuthStore((state) => state.token);
  const { apiWithAuth } = useApi(token || undefined);

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
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: async (userData: {
      email: string;
      password: string;
      name: string;
    }) => {
      const { data } = await api<{ token: string; user: User }>({
        method: "POST",
        url: "/auth/register",
        data: userData,
      });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

// ----------------------
// Login user
// ----------------------
export const useUserLogin = () => {
  const { api } = useApi();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api<{ token: string; user: User }>({
        method: "POST",
        url: "/auth/login",
        data: credentials,
      });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

// ----------------------
// Forgot password
// ----------------------
export const useForgotPassword = () => {
  const { api } = useApi();

  return useMutation({
    mutationKey: ["auth", "forgotPassword"],
    mutationFn: async (email: string) => {
      const { data } = await api<{ message: string }>({
        method: "POST",
        url: "/auth/forgot-password",
        data: { email },
      });
      return data;
    },
  });
};

// ----------------------
// Resend reset code
// ----------------------
export const useResendResetCode = () => {
  const { api } = useApi();

  return useMutation({
    mutationKey: ["auth", "resendCode"],
    mutationFn: async (email: string) => {
      const { data } = await api<{ message: string }>({
        method: "POST",
        url: "/auth/reset-code",
        data: { email },
      });
      return data;
    },
  });
};

// ----------------------
// Reset password
// ----------------------
export const useResetPassword = () => {
  const { api } = useApi();

  return useMutation({
    mutationKey: ["auth", "resetPassword"],
    mutationFn: async (params: {
      email: string;
      resetCode: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const { data } = await api<{ message: string }>({
        method: "POST",
        url: "/auth/reset-password",
        data: {
          email: params.email,
          resetCode: params.resetCode,
          newPassword: params.newPassword,
          confirmPassword: params.confirmPassword,
        },
      });
      return data;
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
