import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ================= BRAND ================= */
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.08,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.grey,
    letterSpacing: 1,
    textTransform: "lowercase",
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  appName: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    marginBottom: 6,
  },

  tagline: {
    fontSize: 14,
    color: COLORS.grey,
    letterSpacing: 1,
    textTransform: "lowercase",
  },

  /* ================= IMAGE ================= */
  illustrationContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
    height: height * 0.32,
    overflow: "hidden",
    marginTop: 32,
  },

  illustration: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
  },

  /* ================= FORM ================= */
  loginSection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  formSection: {
    marginTop: 24,
    width: "100%",
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 6,
    fontWeight: "500",
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.grey,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.white,
    backgroundColor: COLORS.inputBackground || "#1F1F1F",
  },

  inputError: {
    borderColor: COLORS.error,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },

  /* ================= BUTTONS ================= */
  formButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },

  formButtonText: {
    color: COLORS.background,
    fontWeight: "600",
    fontSize: 16,
  },

  resendButton: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },

  resendButtonText: {
    color: COLORS.background,
    fontWeight: "600",
    fontSize: 14,
  },

  termsText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.grey,
  },

  /* ================= KEYBOARD + SCROLL ================= */
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 40,
    paddingBottom: 40, // 🔑 REQUIRED for scrolling
  },
});
