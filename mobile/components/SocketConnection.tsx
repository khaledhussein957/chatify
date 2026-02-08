import { useSocketStore } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { getDeviceId } from "@/utils/device";

const SocketConnection = () => {
  const queryClient = useQueryClient();
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      getDeviceId().then((deviceId) => {
        connect(token, queryClient, deviceId);
      });
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect, queryClient]);

  return null;
};

export default SocketConnection;
