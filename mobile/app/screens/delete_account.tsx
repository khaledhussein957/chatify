import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useDeleteAccount } from "@/hooks/useUser";
import { useLogout } from "@/hooks/useAuth";
import { styles } from "@/assets/styles/profile.style";
import { COLORS } from "@/constants/theme";
import { useAlert } from "@/components/AlertMessageController";

const DeleteAccount = () => {
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  const alert = useAlert();

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      logout();
      router.replace("/(auth)");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete account";
      alert.error(message);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View 
          style={{ 
            width: 60, 
            height: 60, 
            borderRadius: 30, 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
        >
          <Ionicons name="warning" size={32} color={COLORS.error} />
        </View>

        <Text style={styles.modalTitle}>Delete Account?</Text>
        
        <Text style={styles.modalDescription}>
          This action is permanent and cannot be undone. All your messages, 
          chats, and profile data will be permanently removed.
        </Text>

        <View style={styles.modalActions}>
          <Pressable
            style={[styles.dangerButton, deleteAccount.isPending && { opacity: 0.7 }]}
            onPress={handleDelete}
            disabled={deleteAccount.isPending}
          >
            {deleteAccount.isPending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.dangerButtonText}>Delete My Account</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={deleteAccount.isPending}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default DeleteAccount;