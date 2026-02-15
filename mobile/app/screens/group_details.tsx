import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useChats,
  useDeleteChat,
  useLeaveGroupChat,
  useAddMember,
  useUpdateGroupName,
  useUpdateGroupAvatar,
} from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/components/AlertMessageController";
import { COLORS } from "@/constants/theme";

const GroupDetailsScreen = () => {
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { data: chats } = useChats();
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { colors } = useTheme();
  const { mutateAsync: deleteChat } = useDeleteChat();
  const { mutateAsync: leaveGroup } = useLeaveGroupChat();
  const { mutateAsync: addMember, isPending: isAddingMember } = useAddMember();
  const { mutateAsync: updateGroupName, isPending: isUpdatingName } =
    useUpdateGroupName();
  const { mutateAsync: updateGroupAvatar, isPending: isUpdatingAvatar } =
    useUpdateGroupAvatar();
  const alert = useAlert();

  const [isAddMemberModalVisible, setIsAddMemberModalVisible] =
    React.useState(false);
  const [isEditNameModalVisible, setIsEditNameModalVisible] =
    React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

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
      `Are you sure you want to delete the group "${chat.name}"? This action cannot be undone and will delete the chat for all members.`,
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

  const handleLeaveGroup = async () => {
    alert.confirm(
      `Are you sure you want to leave the group "${chat.name}"?`,
      async () => {
        try {
          await leaveGroup(chat._id);
          alert.success("You have left the group");
          router.dismissAll();
          router.replace("/(tabs)");
        } catch (error: any) {
          console.error("Leave group error:", error);
          alert.error(error.message || "Failed to leave group");
        }
      },
      { confirmText: "Leave", confirmColor: COLORS.error },
    );
  };

  const handleAddMember = async (memberId: string) => {
    try {
      await addMember({ chatId: chat._id, memberId });
      alert.success("Member added successfully");
      setIsAddMemberModalVisible(false);
    } catch (error: any) {
      console.error("Add member error:", error);
      alert.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === chat.name) {
      setIsEditNameModalVisible(false);
      return;
    }
    try {
      await updateGroupName({ chatId: chat._id, name: newName.trim() });
      alert.success("Group name updated");
      setIsEditNameModalVisible(false);
    } catch (error: any) {
      console.error("Update group name error:", error);
      alert.error(error.response?.data?.message || "Failed to update name");
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        await updateGroupAvatar({
          chatId: chat._id,
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: asset.fileName || "group-avatar.jpg",
        });
        alert.success("Group avatar updated");
      } catch (error: any) {
        console.error("Update group avatar error:", error);
        alert.error(error.response?.data?.message || "Failed to update avatar");
      }
    }
  };

  const filteredUsers =
    users?.filter((u) => {
      // Don't show current user or users already in the group
      if (u._id === currentUser?._id) return false;
      const isAlreadyInGroup = participants.some(
        (p: any) =>
          p.toString() === u._id || (typeof p === "object" && p._id === u._id),
      );
      if (isAlreadyInGroup) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }) || [];

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
          <View style={styles.avatarWrapper}>
            <Image
              source={chat.groupImage || displayAvatar}
              style={styles.groupAvatar}
            />
            {isAdmin && (
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePickImage}
                disabled={isUpdatingAvatar}
              >
                {isUpdatingAvatar ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons name="camera" size={18} color={colors.background} />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.nameHeader}>
            <Text style={[styles.groupName, { color: colors.foreground }]}>
              {chat.name}
            </Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => {
                  setNewName(chat.name!);
                  setIsEditNameModalVisible(true);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
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
          {isAdmin && (
            <TouchableOpacity
              onPress={() => setIsAddMemberModalVisible(true)}
              style={styles.addParticipantBtn}
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.addParticipantText, { color: colors.primary }]}
              >
                Add
              </Text>
            </TouchableOpacity>
          )}
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
                    {p.name + " " + p.isAdmin && "Admin "}
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

        {/* Actions Section */}
        <View style={styles.adminActions}>
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.error }]}
            onPress={handleLeaveGroup}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>
              Leave Group
            </Text>
          </Pressable>

          {isAdmin && (
            <Pressable
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.error,
                  marginTop: 12,
                  backgroundColor: colors.error + "10",
                },
              ]}
              onPress={handleDeleteGroup}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                Delete Group For Everyone
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ADD MEMBER MODAL */}
      <Modal
        transparent
        animationType="slide"
        visible={isAddMemberModalVisible}
        onRequestClose={() => setIsAddMemberModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay} edges={["top", "bottom"]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, height: "90%" },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.surfaceDivider },
              ]}
            >
              <TouchableOpacity
                onPress={() => setIsAddMemberModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Add Participants
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchInputWrapper,
                  { backgroundColor: colors.surfaceLight },
                ]}
              >
                <Ionicons name="search" size={20} color={colors.grey} />
                <TextInput
                  placeholder="Search users..."
                  placeholderTextColor={colors.grey}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.grey}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Users List */}
            {isLoadingUsers ? (
              <View style={styles.modalCentered}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.modalCentered}>
                <Text style={{ color: colors.grey }}>No users found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.modalListContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      { borderBottomColor: colors.surfaceDivider },
                    ]}
                    onPress={() => handleAddMember(item._id)}
                    disabled={isAddingMember}
                  >
                    <Image
                      source={
                        item.avatar ||
                        `https://ui-avatars.com/api/?name=${item.name}&background=random`
                      }
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.userNameModal,
                          { color: colors.foreground },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.grey }]}>
                        {item.phone || item.email}
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* EDIT NAME MODAL */}
      <Modal
        transparent
        animationType="fade"
        visible={isEditNameModalVisible}
        onRequestClose={() => setIsEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View
            style={[
              styles.modalContentSmall,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Rename Group
            </Text>
            <View
              style={[
                styles.searchInputWrapper,
                { backgroundColor: colors.surfaceLight, marginTop: 16 },
              ]}
            >
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Enter group name"
                placeholderTextColor={colors.grey}
                autoFocus
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setIsEditNameModalVisible(false)}
                style={styles.modalBtn}
              >
                <Text style={{ color: colors.grey }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateName}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={{ color: colors.background, fontWeight: "600" }}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  nameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
  },
  memberCount: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addParticipantBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addParticipantText: {
    fontSize: 14,
    fontWeight: "600",
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
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  modalCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameModal: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentSmall: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
});

export default GroupDetailsScreen;
