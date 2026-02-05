import React, { useState } from "react";
import { useChats } from "@/hooks/useChat";
import { Chat } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet, TextInput } from "react-native";
import { COLORS } from "@/constants/theme";
import ChatItem from "@/components/ChatItem";
import EmptyUI from "@/components/EmptyItem";

import { SafeAreaView } from "react-native-safe-area-context";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, error, refetch } = useChats();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load chats</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const privateChats = chats?.filter((chat) => !chat.isGroupChat) || [];
  const filteredChats = privateChats.filter((chat) => 
    chat.participant?.name?.toLowerCase().includes(search.toLowerCase())
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
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.grey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats..."
              placeholderTextColor={COLORS.grey}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ChatItem chat={item} onPress={() => handleChatPress(item)} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyUI
            title={search ? "No results found" : "No chats yet"}
            subtitle={search ? "Try a different search term" : "Start a conversation!"}
            iconName="chatbubbles-outline"
            iconColor={COLORS.grey}
            iconSize={64}
            buttonLabel="New Chat"
            onPressButton={() => router.push("/new-chat")}
          />
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push("/new-chat")}>
        <Ionicons name="create-outline" size={24} color={COLORS.background} />
      </Pressable>
    </View>
  );
};

export default ChatsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  safeArea: {
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.foreground,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.foreground,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.background,
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
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
