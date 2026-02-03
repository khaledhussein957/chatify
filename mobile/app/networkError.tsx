import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";

const { height } = Dimensions.get("window");

const NetworkErrorScreen = () => {
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  const handleRetry = async () => {
    setLoading(true);

    try {
      const state = await NetInfo.fetch();

      if (state.isConnected) {
        if (isAuthenticated) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)");
        }
      }
    } catch (error) {
      console.log("Retry network check failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Network Error</Text>

      <Text style={styles.message}>
        Unable to connect. Please check your internet connection and try again.
      </Text>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRetry}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>Refresh</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  imageContainer: {
    height: height * 0.3,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: 260,
    height: 260,
    opacity: 0.9,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },

  message: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.grey,
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 28,
  },

  button: {
    height: 52,
    minWidth: 160,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NetworkErrorScreen;
