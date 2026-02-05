import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChats } from "@/hooks/useChat";
import { COLORS } from "@/constants/theme";
import ChatItem from "@/components/ChatItem";

import { SafeAreaView } from "react-native-safe-area-context";
import EmptyUI from "@/components/EmptyItem";

export default function GroupScreen() {
  const router = useRouter();
  const { data: chats, isLoading } = useChats();
  const [search, setSearch] = useState("");

  const groupChats = chats?.filter((chat) => chat.isGroupChat) || [];
  const filteredGroups = groupChats.filter((group) =>
    group.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.grey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              placeholderTextColor={COLORS.grey}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => router.push(`/chat/${item._id}`)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyUI
            title={search ? "No results found" : "No chats yet"}
            subtitle={search ? "No groups found" : "You haven't joined any groups yet"}
            iconName="people-outline"
            iconColor={COLORS.grey}
            iconSize={64}
            buttonLabel="New Group"
            onPressButton={() => router.push("/screens/select_participates")}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/screens/select_participates")}
      >
        <Ionicons name="add" size={30} color={COLORS.background} />
      </TouchableOpacity>
    </View>
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
