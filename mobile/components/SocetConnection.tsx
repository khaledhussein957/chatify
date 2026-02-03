import { useSocketStore } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SocketConnection = () => {
  const queryClient = useQueryClient();
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const getTokenFromStorage = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken"); // your JWT key
        if (active && storedToken) {
          setToken(storedToken);
          connect(storedToken, queryClient);
        } else {
          disconnect();
        }
      } catch (err) {
        console.warn("Failed to get token for socket connection", err);
        disconnect();
      }
    };

    getTokenFromStorage();

    return () => {
      active = false;
      disconnect();
    };
  }, [connect, disconnect, queryClient]);

  return null;
};

export default SocketConnection;
