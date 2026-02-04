import { useSocketStore } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

const SocketConnection = () => {
  const queryClient = useQueryClient();
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    console.log("SocketConnection effect triggered. Token present:", !!token);
    if (token) {
      console.log("Attempting to connect with token...");
      connect(token, queryClient);
    } else {
      console.log("No token, disconnecting socket...");
      disconnect();
    }

    return () => {
      console.log("SocketConnection effect cleanup");
    };
  }, [token, connect, disconnect, queryClient]);

  return null;
};

export default SocketConnection;
