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
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useAuthStore } from "@/store/auth";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";
import StatusCard from "@/components/StatusCard";
import { useCreateStatus, useStatuses } from "@/hooks/useStatus";
import { Status } from "@/types";

const StatusScreen = () => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { colors, isDark } = useTheme();
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
      if (!status?.user?._id) return;
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Status
        </Text>
        <View style={styles.headerActions}>
          {isRefetching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={others}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={
            <View>
              <Text style={[styles.sectionLabel, { color: colors.grey }]}>
                My Status
              </Text>
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
              <Text style={[styles.sectionLabel, { color: colors.grey }]}>
                Recent updates
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
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
            <View style={[styles.emptyContainer, { marginTop: 40 }]}>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No status updates yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.grey }]}>
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsCreateModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surfaceCard,
                borderWidth: isDark ? 1 : 0,
                borderColor: colors.surfaceLight,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              New Status
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.grey }]}>
              Share a text update.
            </Text>
            <View
              style={[
                styles.modalInputWrapper,
                { backgroundColor: colors.surfaceLight },
              ]}
            >
              <TextInput
                style={[styles.modalInput, { color: colors.foreground }]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.grey}
                value={statusText}
                onChangeText={setStatusText}
                multiline
                maxLength={200}
                autoFocus
                selectionColor={colors.primary}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  { backgroundColor: colors.surfaceLight },
                ]}
                onPress={() => {
                  setIsCreateModalVisible(false);
                  setStatusText("");
                }}
                disabled={isCreating}
              >
                <Text
                  style={[styles.modalCancelText, { color: colors.foreground }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCreateButton,
                  { backgroundColor: colors.primary },
                  !statusText.trim() && styles.modalButtonDisabled,
                ]}
                onPress={handleCreateStatus}
                disabled={!statusText.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator
                    color={isDark ? colors.background : colors.white}
                  />
                ) : (
                  <Text
                    style={[
                      styles.modalCreateText,
                      { color: isDark ? colors.background : colors.white },
                    ]}
                  >
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* TYPE SELECTION MODAL WITH ICONS */}
      <Modal
        transparent
        animationType="fade"
        visible={isTypeModalVisible}
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsTypeModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surfaceCard,
                borderWidth: isDark ? 1 : 0,
                borderColor: colors.surfaceLight,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Create Status
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.grey }]}>
              Choose what kind of status you want to share.
            </Text>

            <View style={styles.iconRow}>
              <TouchableOpacity
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: colors.surfaceLight,
                    shadowColor: colors.grey,
                  },
                ]}
                onPress={() => {
                  setIsTypeModalVisible(false);
                  setIsCreateModalVisible(true);
                }}
                disabled={isCreating}
              >
                <Ionicons
                  name="create-outline"
                  size={28}
                  color={colors.foreground}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: colors.surfaceLight,
                    shadowColor: colors.grey,
                  },
                ]}
                onPress={async () => {
                  setIsTypeModalVisible(false);
                  await handlePickMediaAndPreview();
                }}
                disabled={isCreating}
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setIsTypeModalVisible(true)}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator
            color={isDark ? colors.background : colors.white}
          />
        ) : (
          <Ionicons
            name="add"
            size={26}
            color={isDark ? colors.background : "#FFF"}
          />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  emptyContainer: { paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtitle: { fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, marginBottom: 24, textAlign: "center" },
  modalInputWrapper: {
    width: "100%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    minHeight: 120,
  },
  modalInput: {
    fontSize: 18,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  charCounter: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButton: {},
  modalCreateButton: {},
  modalButtonDisabled: { opacity: 0.5 },
  modalCancelText: { fontWeight: "600", fontSize: 16 },
  modalCreateText: { fontWeight: "700", fontSize: 16 },

  // Icon Row for TYPE Modal
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    width: "100%",
    marginTop: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default StatusScreen;
