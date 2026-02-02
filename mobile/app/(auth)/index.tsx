import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import useAuthSocial from "@/hooks/useSocialAuth";
import { styles } from "@/assets/styles/auth.style";

const AuthScreen = () => {
  const { handleSocialAuth, loadingStrategy } = useAuthSocial();
  const isLoading = loadingStrategy !== null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* BRAND SECTION */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons
              name="chatbubble-ellipses"
              size={32}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.appName}>spotlight</Text>
        </View>

        {/* IMAGE */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/social-signIn.png")}
            style={styles.illustration}
            resizeMode="contain"
            resizeMethod="resize"
            accessibilityIgnoresInvertColors
          />
        </View>

        {/* BUTTONS */}
        <View style={styles.loginSection}>
          <View style={styles.buttonRow}>
            {/* GOOGLE */}
            <Pressable
              disabled={isLoading}
              style={[styles.button, styles.googleButton]}
              onPress={() => handleSocialAuth("oauth_google")}
            >
              {loadingStrategy === "oauth_google" ? (
                <ActivityIndicator color="#22C55E" />
              ) : (
                <Text style={styles.buttonTextLight}>Google</Text>
              )}
            </Pressable>

            {/* APPLE */}
            <Pressable
              disabled={isLoading}
              style={[styles.button, styles.appleButton]}
              onPress={() => handleSocialAuth("oauth_apple")}
            >
              {loadingStrategy === "oauth_apple" ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.buttonTextDark}>Apple</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AuthScreen;
