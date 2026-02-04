// styles/profile.styles.ts
import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // black
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginTop: height * 0.1,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary, // green border
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 999,
  },

  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary, // green
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.grey,
  },

  onlineStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(34, 197, 94, 0.15)", // green glow
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary, // green
    marginRight: 8,
  },

  onlineText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary, // green
  },

  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.grey,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    overflow: "hidden",
  },

  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  sectionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },

  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  sectionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.foreground,
  },

  sectionValue: {
    fontSize: 14,
    color: COLORS.grey,
    marginRight: 4,
  },

  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },

  // Edit Profile Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.grey,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.background,
  },

  // Danger / Modal Styles
  dangerButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.grey,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },

  // Consistent Sub-page Styles
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    width: "100%",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  avatarHeader: {
    alignItems: "center",
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.5,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    height: 52,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 52,
    color: COLORS.foreground,
  },
  eyeIcon: {
    paddingRight: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
