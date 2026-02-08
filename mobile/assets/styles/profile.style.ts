// styles/profile.styles.ts
import { StyleSheet, Dimensions } from "react-native";

const { height } = Dimensions.get("window");

export const getProfileStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderColor: colors.primary,
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
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },

    name: {
      marginTop: 16,
      fontSize: 24,
      fontWeight: "700",
      color: colors.primary,
    },

    email: {
      marginTop: 4,
      fontSize: 14,
      color: colors.grey,
    },

    onlineStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      backgroundColor: `${colors.primary}25`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },

    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.primary,
      marginRight: 8,
    },

    onlineText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.primary,
    },

    sectionContainer: {
      marginTop: 24,
      marginHorizontal: 20,
    },

    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.grey,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },

    sectionCard: {
      backgroundColor: colors.surfaceCard,
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
      borderBottomColor: colors.surfaceLight,
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
      color: colors.foreground,
    },

    sectionValue: {
      fontSize: 14,
      color: colors.grey,
      marginRight: 4,
    },

    logoutButton: {
      marginHorizontal: 20,
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.error}33`,
      backgroundColor: `${colors.error}1A`,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    },

    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.error,
      marginLeft: 8,
    },

    // Edit Profile Styles
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.grey,
      marginBottom: 8,
      marginLeft: 4,
    },
    input: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.surfaceLight,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.background,
    },

    // Danger / Modal Styles
    dangerButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.white,
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
      backgroundColor: colors.surfaceCard,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.surfaceLight,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      marginTop: 16,
      marginBottom: 8,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.grey,
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
      color: colors.grey,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
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
      color: colors.primary,
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
      backgroundColor: colors.surfaceCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceLight,
      height: 52,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      fontSize: 16,
      height: 52,
      color: colors.foreground,
    },
    eyeIcon: {
      paddingRight: 15,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
  });
