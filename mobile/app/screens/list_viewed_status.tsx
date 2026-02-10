import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStatusViewers } from "@/hooks/useStatus";

const ListViewedStatusScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { statusId } = useLocalSearchParams<{ statusId: string }>();

  const { data, isLoading } = useStatusViewers(statusId);

  const viewers = data?.viewers || [];
  const reactions = data?.reactions || [];

  return (
    <View style={styles.container}>
      <Pressable style={styles.overlay} onPress={() => router.back()} />
      <View
        style={[styles.modalContent, { backgroundColor: colors.surfaceCard }]}
      >
        <View
          style={[styles.handle, { backgroundColor: colors.grey + "40" }]}
        />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Viewed by {viewers.length > 0 ? `(${viewers.length})` : ""}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={viewers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons
                  name="eye-off-outline"
                  size={48}
                  color={colors.grey}
                  style={{ marginBottom: 12 }}
                />
                <Text style={{ color: colors.grey, fontSize: 16 }}>
                  No views yet
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const hasReacted = reactions.includes(item._id);
              return (
                <View style={styles.viewerItem}>
                  <View style={styles.viewerInfo}>
                    <Image
                      source={{
                        uri: item.avatar || "https://via.placeholder.com/150",
                      }}
                      style={styles.avatar}
                    />
                    <Text style={[styles.name, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                  </View>
                  {hasReacted && (
                    <Ionicons name="heart" size={20} color="#4ADE80" />
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    height: "60%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  viewerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  center: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ListViewedStatusScreen;
