import { useSocketStore } from "@/lib/socket";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const SocketConnection = () => {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!isSignedIn) {
        disconnect();
        return;
      }
      try {
        const token = await getToken();
        if (active && token) connect(token, queryClient);
      } catch (err) {
        console.warn("Socket auth token fetch failed", err);
      }
    };

    run();

    return () => {
      active = false;
      disconnect();
    };
  }, [isSignedIn, connect, disconnect, getToken, queryClient]);

  return null;
};

export default SocketConnection;
