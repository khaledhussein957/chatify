import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useTheme } from "@/hooks/useTheme";
import { COLORS } from "@/constants/theme";

const TabsLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [networkError, setNetworkError] = useState(false);
  const { colors, isDark } = useTheme();

  // Monitor network
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setNetworkError(!state.isConnected);
    });
    return () => unsub();
  }, []);

  if (networkError) return <Redirect href="/networkError" />;
  if (!isAuthenticated) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.surfaceLight,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="group"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "camera" : "camera-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
