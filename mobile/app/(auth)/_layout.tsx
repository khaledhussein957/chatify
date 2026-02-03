
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default AuthLayout;