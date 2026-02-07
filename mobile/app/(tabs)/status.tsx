import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { COLORS } from "@/constants/theme";
import { useAuthStore } from "@/store/auth";
import StatusCard from "@/components/StatusCard";
import { useCreateStatus, useStatuses } from "@/hooks/useStatus";
import type { Status } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { useAlert } from "@/components/AlertMessageController";

const StatusScreen = () => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const alert = useAlert();

  const { data: statuses, isLoading, refetch, isRefetching } = useStatuses();
  const { mutate: createStatus, isPending: isCreating } = useCreateStatus();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [statusText, setStatusText] = useState("");

  const groupedByUser = useMemo(() => {
    const map = new Map<
      string,
      { userId: string; name: string; avatar?: string; statuses: Status[] }
    >();

    statuses?.forEach((status) => {
      const userId = status.user._id;
      const existing = map.get(userId);
      if (existing) {
        existing.statuses.push(status);
      } else {
        map.set(userId, {
          userId,
          name: status.user.name,
          avatar: status.user.avatar,
          statuses: [status],
        });
      }
    });

    return Array.from(map.values());
  }, [statuses]);

  const myStatuses = groupedByUser.find((g) => g.userId === currentUser?._id);
  const others = groupedByUser.filter((g) => g.userId !== currentUser?._id);

  const handleOpenUserStatuses = (userId: string) => {
    router.push({
      pathname: "/screens/view_status",
      params: { userId },
    });
  };

  const handleCreateStatus = () => {
    if (!statusText.trim()) return;

    createStatus(
      { text: statusText.trim() },
      {
        onSuccess: () => {
          setStatusText("");
          setIsCreateModalVisible(false);
          refetch();
        },
      },
    );
  };

  const handlePickMediaAndPreview = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      let durationSeconds: number | undefined;
      if (asset.type === "video" && typeof asset.duration === "number") {
        durationSeconds =
          asset.duration > 1000
            ? Math.round(asset.duration / 1000)
            : Math.round(asset.duration);
        if (durationSeconds > 60) {
          alert.error("Selected video is longer than 60 seconds.");
          return;
        }
      }

      const mime =
        asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");
      const fileName =
        asset.fileName ||
        `status_${Date.now()}${asset.type === "video" ? ".mp4" : ".jpg"}`;

      router.push({
        pathname: "/screens/preview_content",
        params: {
          uri: asset.uri,
          type: asset.type,
          mimeType: mime,
          fileName,
          duration: durationSeconds ? String(durationSeconds) : "",
        },
      });
    }
  };

  const currentUserAvatar = currentUser?.avatar;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
        <View style={styles.headerActions}>
          {isRefetching && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
      </View>

      {/* STATUS LIST */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={others}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionLabel}>My Status</Text>
              <StatusCard
                name={currentUser?.name || "You"}
                avatar={currentUserAvatar}
                hasUnseen={
                  !!myStatuses &&
                  myStatuses.statuses.some(
                    (s) => !s.viewers.includes(currentUser?._id || ""),
                  )
                }
                isOwn
                onPress={() =>
                  myStatuses
                    ? handleOpenUserStatuses(currentUser?._id || "")
                    : setIsCreateModalVisible(true)
                }
              />
              <Text style={styles.sectionLabel}>Recent updates</Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasUnseen = item.statuses.some(
              (s) => !s.viewers.includes(currentUser?._id || ""),
            );

            return (
              <StatusCard
                name={item.name}
                avatar={item.avatar}
                hasUnseen={hasUnseen}
                onPress={() => handleOpenUserStatuses(item.userId)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No status updates yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to share what{" "}
                {currentUser?.name?.split(" ")[0] || "you"} are up to.
              </Text>
            </View>
          }
        />
      )}

      {/* CREATE STATUS MODAL */}
      <Modal
        transparent
        animationType="slide"
        visible={isCreateModalVisible}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Status</Text>
            <Text style={styles.modalSubtitle}>Share a text update.</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder="What's on your mind?"
                placeholderTextColor={COLORS.grey}
                value={statusText}
                onChangeText={setStatusText}
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsCreateModalVisible(false);
                  setStatusText("");
                }}
                disabled={isCreating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCreateButton,
                  !statusText.trim() && styles.modalButtonDisabled,
                ]}
                onPress={handleCreateStatus}
                disabled={!statusText.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.modalCreateText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TYPE SELECTION MODAL WITH ICONS */}
      <Modal
        transparent
        animationType="fade"
        visible={isTypeModalVisible}
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Status</Text>
            <Text style={styles.modalSubtitle}>
              Choose what kind of status you want to share.
            </Text>

            <View style={styles.iconRow}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => {
                  setIsTypeModalVisible(false);
                  setIsCreateModalVisible(true);
                }}
                disabled={isCreating}
              >
                <Ionicons
                  name="create-outline"
                  size={28}
                  color={COLORS.foreground}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconCircle}
                onPress={async () => {
                  setIsTypeModalVisible(false);
                  await handlePickMediaAndPreview();
                }}
                disabled={isCreating}
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={COLORS.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsTypeModalVisible(true)}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Ionicons name="add" size={26} color={COLORS.background} />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: COLORS.foreground, fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionLabel: {
    color: COLORS.grey,
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  emptyContainer: { paddingHorizontal: 24, paddingTop: 40 },
  emptyTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtitle: { color: COLORS.grey, fontSize: 14 },

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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.foreground,
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: COLORS.grey, marginBottom: 16 },
  modalInputWrapper: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    minHeight: 80,
  },
  modalInput: { fontSize: 16, color: COLORS.foreground },
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
  modalCancelButton: { backgroundColor: COLORS.surfaceLight },
  modalCreateButton: { backgroundColor: COLORS.primary },
  modalButtonDisabled: { opacity: 0.5 },
  modalCancelText: { color: COLORS.foreground, fontWeight: "500" },
  modalCreateText: { color: COLORS.background, fontWeight: "600" },

  // Icon Row for TYPE Modal
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
});

export default StatusScreen;
