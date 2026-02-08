import React, { useState } from "react";
import { useChats } from "@/hooks/useChat";
import { Chat } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  StyleSheet,
  TextInput,
  RefreshControl,
} from "react-native";
import ChatItem from "@/components/ChatItem";
import EmptyUI from "@/components/EmptyItem";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, error, refetch } = useChats();
  const [search, setSearch] = useState("");
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Failed to load chats</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const privateChats = chats?.filter((chat) => !chat.isGroupChat) || [];
  const filteredChats = privateChats.filter((chat) =>
    chat.participant?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chat._id,
        participantId: chat.participant?._id || "",
        name: chat.isGroupChat ? chat.name : chat.participant?.name,
        avatar: chat.isGroupChat ? "" : chat.participant?.avatar,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Chats
          </Text>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.surfaceLight,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.grey} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search chats..."
              placeholderTextColor={colors.grey}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyUI
            title={search ? "No results found" : "No chats yet"}
            subtitle={
              search ? "Try a different search term" : "Start a conversation!"
            }
            iconName="chatbubbles-outline"
            iconColor={colors.grey}
            iconSize={64}
            buttonLabel="New Chat"
            onPressButton={() => router.push("/new-chat")}
          />
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/new-chat")}
      >
        <Ionicons
          name="create-outline"
          size={24}
          color={isDark ? colors.background : "#FFF"}
        />
      </Pressable>
    </View>
  );
};

export default ChatsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
