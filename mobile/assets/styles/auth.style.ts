import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // black
  },

  brandSection: {
    alignItems: "center",
    marginTop: height * 0.1,
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(34, 197, 94, 0.15)", // green glow
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  appName: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary, // green
    marginBottom: 6,
  },

  tagline: {
    fontSize: 14,
    color: COLORS.grey,
    letterSpacing: 1,
    textTransform: "lowercase",
  },

  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
    height: height * 0.32, // 👈 controls how tall the image area is
    overflow: "hidden", // 👈 REQUIRED for cover
    marginTop: 32,
  },

  illustration: {
    width: "100%",
  height: undefined,
    aspectRatio: 1,
  },

  loginSection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 14,
  },

  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  googleButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  appleButton: {
    backgroundColor: COLORS.primary,
  },

  buttonTextLight: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },

  buttonTextDark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },

  termsText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.grey,
  },
});
