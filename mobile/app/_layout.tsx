import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import AuthSync from "@/components/AuthSync";
import SocketConnection from "@/components/SocetConnection";

const queryClient = new QueryClient();

/**
 * Root application layout that supplies authentication, React Query, socket connectivity, and app navigation.
 *
 * This component wraps the app in authentication and data-fetching providers, renders authentication synchronization
 * and a status bar, establishes a socket connection, and declares the top-level navigation stack with the
 * "(auth)" and "(tabs)" screens (both using a fade animation).
 *
 * @returns The root JSX element containing provider wrappers, the socket connection, and the navigation stack.
 */
export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        <StatusBar style="light" />
        <SocketConnection />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0D0D0F" },
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        </Stack>
      </QueryClientProvider>
    </ClerkProvider>
  );
}