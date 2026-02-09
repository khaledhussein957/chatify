import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

import SocketConnection from "@/components/SocketConnection";
import { AlertProvider } from "@/components/AlertMessageController";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { useUpdatePushToken } from "@/hooks/useAuth";

import * as Notifications from "expo-notifications";

const queryClient = new QueryClient();

const RootLayoutInner = () => {
  const { colors, isDark } = useTheme();
  const token = useAuthStore((state) => state.token);
  const { mutate: updatePushToken } = useUpdatePushToken();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      registerForPushNotificationsAsync().then((pushToken) => {
        if (pushToken) {
          updatePushToken(pushToken);
        }
      });
    }
  }, [token, updatePushToken]);

  useEffect(() => {
    // Handle notification click (when app is in foreground or background)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.chatId) {
          router.push(`/chat/${data.chatId}`);
        }
      },
    );

    // Handle background click (app killed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.chatId) {
          router.push(`/chat/${data.chatId}`);
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SocketConnection />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="new-chat"
          options={{
            animation: "slide_from_bottom",
            presentation: "modal",
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="screens"
          options={{
            presentation: "transparentModal",
            animation: "none",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <RootLayoutInner />
      </AlertProvider>
    </QueryClientProvider>
  );
}
