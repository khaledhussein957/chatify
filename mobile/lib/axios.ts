import axios from "axios";
import { useCallback } from "react";

const API_URL = "http://192.168.8.55:9000/api";

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor registered once
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn("API request failed", {
        endpoint: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
      });
    } else if (error.request) {
      console.warn("API request failed - no response", {
        endpoint: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  },
);

// Custom hook to use API with JWT
export const useApi = (token?: string) => {
  // token can be passed from app state / AsyncStorage / context
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
