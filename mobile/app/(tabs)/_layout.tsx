import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

const TabsLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [networkError, setNetworkError] = useState(false);

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
          backgroundColor: "#000000", // black
          borderTopColor: "#1F2933", // subtle dark border
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#22C55E", // green
        tabBarInactiveTintColor: "#6B7280", // muted gray
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
