import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChats, useDeleteChat } from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/components/AlertMessageController";
import { COLORS } from "@/constants/theme";

const GroupDetailsScreen = () => {
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { data: chats } = useChats();
  const { data: currentUser } = useCurrentUser();
  const { colors } = useTheme();
  const { mutateAsync: deleteChat } = useDeleteChat();
  const alert = useAlert();

  const chat = chats?.find((c) => c._id === chatId);

  if (!chat) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.grey }}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const participants = chat.participants || [];
  const displayAvatar = `https://ui-avatars.com/api/?name=${chat.name}&background=random&size=200`;

  const isAdmin = (chat.admins ?? []).some(
    (admin: any) =>
      admin.toString() === currentUser?._id ||
      (typeof admin === "object" && admin._id === currentUser?._id),
  );

  const handleDeleteGroup = async () => {
    alert.confirm(
      `Are you sure you want to delete the group "${chat.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteChat(chat._id);
          alert.success("Group deleted successfully");
          router.dismissAll();
          router.replace("/(tabs)");
        } catch (error: any) {
          console.error("Delete group error:", error);
          alert.error(error.message || "Failed to delete group");
        }
      },
      { confirmText: "Delete", confirmColor: COLORS.error },
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Group Info
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Section */}
        <View style={styles.infoSection}>
          <Image source={displayAvatar} style={styles.groupAvatar} />
          <Text style={[styles.groupName, { color: colors.foreground }]}>
            {chat.name}
          </Text>
          <Text style={[styles.memberCount, { color: colors.grey }]}>
            {participants.length}{" "}
            {participants.length === 1 ? "Member" : "Members"}
          </Text>
        </View>

        {/* Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Participants
          </Text>
        </View>

        <View style={styles.membersList}>
          {participants.map((participant: any, index: number) => {
            const p =
              typeof participant === "string"
                ? { name: "User", _id: participant }
                : participant;
            const pAvatar =
              p.avatar ||
              `https://ui-avatars.com/api/?name=${p.name}&background=random`;

            return (
              <View
                key={p._id || index}
                style={[
                  styles.memberItem,
                  {
                    borderBottomColor:
                      index === participants.length - 1
                        ? "transparent"
                        : colors.surfaceDivider,
                  },
                ]}
              >
                <Image source={pAvatar} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text
                    style={[styles.memberName, { color: colors.foreground }]}
                  >
                    {p.name}
                  </Text>
                  {p.phone && (
                    <Text style={[styles.memberPhone, { color: colors.grey }]}>
                      {p.phone}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <Pressable
              style={[styles.deleteBtn, { borderColor: colors.error }]}
              onPress={handleDeleteGroup}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>
                Delete Group
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey + "20",
  },
  groupAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.8,
  },
  membersList: {
    paddingHorizontal: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberInfo: {
    marginLeft: 16,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  adminActions: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GroupDetailsScreen;
