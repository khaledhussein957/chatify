import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUsers } from "@/hooks/useUser";
import { useCreateGroupChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/auth";
import { useAlert } from "@/components/AlertMessageController";
import { COLORS } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectParticipatesScreen() {
  const router = useRouter();
  const { data: users, isLoading } = useUsers();
  const { mutate: createGroup, isPending } = useCreateGroupChat();
  const currentUser = useAuthStore((state) => state.user);
  const alert = useAlert();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      alert.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      alert.error("Please select at least 2 other participants");
      return;
    }

    createGroup(
      { name: groupName, participantIds: selectedUsers },
      {
        onSuccess: (chat) => {
          setIsModalVisible(false);
          setGroupName("");
          router.push(`/chat/${chat._id}`);
        },
        onError: (error: any) => {
          alert.error(
            error?.response?.data?.message || "Failed to create group"
          );
        },
      }
    );
  };

  const filteredUsers =
    users?.filter((u) => {
      if (u._id === currentUser?._id) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }) || [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.surfaceLight,
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            height: "95%",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.surfaceLight,
              backgroundColor: COLORS.background,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                backgroundColor: COLORS.surfaceLight,
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.foreground,
                  fontSize: 20,
                  fontWeight: "600",
                }}
              >
                New group
              </Text>
              <Text style={{ color: COLORS.grey, fontSize: 12, marginTop: 2 }}>
                Select participants
              </Text>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              backgroundColor: COLORS.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surfaceLight,
                borderRadius: 24,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: COLORS.surfaceLight,
              }}
            >
              <Ionicons name="search" size={18} color={COLORS.grey} />
              <TextInput
                placeholder="Search participants"
                placeholderTextColor={COLORS.grey}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: COLORS.foreground,
                  fontSize: 16,
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* SECTION HEADER */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Participants</Text>
            <Text style={styles.sectionCount}>
              {selectedUsers.length} selected
            </Text>
          </View>

          {/* USERS LIST */}
          <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 20,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={64}
                  color={COLORS.grey}
                />
                <Text
                  style={{ color: COLORS.grey, fontSize: 18, marginTop: 12 }}
                >
                  No users found
                </Text>
                <Text
                  style={{
                    color: COLORS.grey,
                    fontSize: 14,
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Try a different search term
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      selectedUsers.includes(item._id) &&
                        styles.selectedUserItem,
                    ]}
                    onPress={() => toggleUserSelection(item._id)}
                  >
                    <View style={styles.avatarWrapper}>
                      <Image
                        source={
                          item.avatar
                            ? { uri: item.avatar }
                            : `https://ui-avatars.com/api/?name=${item.name}&background=random`
                        }
                        style={styles.avatar}
                      />
                      {selectedUsers.includes(item._id) && (
                        <View style={styles.checkGlow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedUsers.includes(item._id) &&
                          styles.checkboxActive,
                      ]}
                    >
                      {selectedUsers.includes(item._id) && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={COLORS.background}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </View>

      {/* FLOATING ACTION BUTTON */}
      {selectedUsers.length >= 2 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Ionicons name="arrow-forward" size={22} color={COLORS.background} />
          )}
        </TouchableOpacity>
      )}

      {/* GROUP NAME MODAL */}
      <Modal
        transparent
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create group</Text>
            <Text style={styles.modalSubtitle}>
              Enter a name for your new group
            </Text>

            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder="Group name"
                placeholderTextColor={COLORS.grey}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsModalVisible(false);
                  setGroupName("");
                }}
                disabled={isPending}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCreateButton,
                  (!groupName.trim() || isPending) && styles.disabledButton,
                ]}
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || isPending}
              >
                {isPending ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.modalCreateText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  nameInput: {
    fontSize: 16,
    color: COLORS.foreground,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: COLORS.background,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceCard,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.grey,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  selectedUserItem: {
    backgroundColor: "rgba(34, 197, 94, 0.05)",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  checkGlow: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.background,
    borderRadius: 99,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.foreground,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.grey,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.foreground,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 16,
  },
  modalInputWrapper: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  modalInput: {
    fontSize: 16,
    color: COLORS.foreground,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    minWidth: 90,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCancelButton: {
    backgroundColor: COLORS.surfaceLight,
  },
  modalCreateButton: {
    backgroundColor: COLORS.primary,
  },
  modalCancelText: {
    color: COLORS.foreground,
    fontWeight: "500",
  },
  modalCreateText: {
    color: COLORS.background,
    fontWeight: "600",
  },
});
