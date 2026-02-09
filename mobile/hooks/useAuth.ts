import { useApi } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
      const { data } = await api<{ message: string; userId: string }>({
        method: "POST",
        url: "/auth/register",
        data: userData,
      });
      return data;
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
    mutationFn: async (credentials: {
      email: string;
      password: string;
      deviceId?: string;
    }) => {
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
