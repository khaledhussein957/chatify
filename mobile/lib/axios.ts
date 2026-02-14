import axios from "axios";
import { useCallback } from "react";
import { useAuthStore } from "@/store/auth";

const API_URL = "https://chatify-server-dd9f.onrender.com/api";

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 seconds (needed for slow media uploads)
});

// Response interceptor registered once
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Prioritize the message from the server if available
      if (error.response.data?.message) {
        error.message = error.response.data.message;
      }
    } else if (
      error.code === "ECONNABORTED" ||
      error.message.includes("timeout")
    ) {
      console.warn("API request timed out:", error.message);
      error.message = "Request timed out. Please check your connection.";
    } else {
      console.warn("API network error or setup issue:", error.message);
    }
    return Promise.reject(error);
  },
);

// Custom hook to use API with JWT
export const useApi = () => {
  const token = useAuthStore((state) => state.token);

  const apiWithAuth = useCallback(
    async <T>(config: Parameters<typeof api.request>[0]) => {
      return api.request<T>({
        ...config,
        headers: {
          ...config.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
    },
    [token],
  );

  return { api, apiWithAuth };
};
