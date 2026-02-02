import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useAuthSocial from "@/hooks/useSocialAuth";

const AuthScreen = () => {
  const { handleSocialAuth, loadingStrategy } = useAuthSocial();

  const isLoading = loadingStrategy !== null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{ gap: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            disabled={isLoading}
            style={[styles.button, styles.googleButton]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={() => handleSocialAuth("oauth_google")}
          >
            {loadingStrategy === "oauth_google" ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <>
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                  Google
                </Text>
              </>
            )}
          </Pressable>

          {/* APPLE BTN */}
          <Pressable
            disabled={isLoading}
            style={[styles.button, styles.appleButton]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            onPress={() => handleSocialAuth("oauth_apple")}
          >
            {loadingStrategy === "oauth_apple" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={{ color: "#000000", fontWeight: "600", fontSize: 16 }}>
                  Apple
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
  },
  googleButton: {
    backgroundColor: "#000000",
  },
  appleButton: {
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

export default AuthScreen;
