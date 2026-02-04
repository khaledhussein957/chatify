import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SocketConnection from "@/components/SocetConnection";
import { AlertProvider } from "@/components/AlertMessageController";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AlertProvider>
        <SocketConnection />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0D0D0F" },
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen 
            name="screens" 
            options={{ 
              presentation: "transparentModal",
              animation: "none",
              contentStyle: { backgroundColor: "transparent" }
            }} 
          />
        </Stack>
      </AlertProvider>
    </QueryClientProvider>
  );
}
