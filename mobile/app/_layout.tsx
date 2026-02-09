import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

import SocketConnection from "@/components/SocketConnection";
import CallOverlay from "@/components/CallOverlay";
import { AlertProvider } from "@/components/AlertMessageController";
// import { useEffect } from "react";
// import { useAuthStore } from "@/store/auth";
// import { registerForPushNotificationsAsync } from "@/utils/notifications";
// import { useUpdatePushToken } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const RootLayoutInner = () => {
  const { colors, isDark } = useTheme();
  // const token = useAuthStore((state) => state.token);
  // const { mutate: updatePushToken } = useUpdatePushToken();

  // useEffect(() => {
  //   if (token) {
  //     registerForPushNotificationsAsync().then((pushToken) => {
  //       if (pushToken) {
  //         updatePushToken(pushToken);
  //       }
  //     });
  //   }
  // }, [token, updatePushToken]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SocketConnection />
      {/* <CallOverlay /> */}
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
