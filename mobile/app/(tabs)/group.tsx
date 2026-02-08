import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChats } from "@/hooks/useChat";
import ChatItem from "@/components/ChatItem";

import { SafeAreaView } from "react-native-safe-area-context";
import EmptyUI from "@/components/EmptyItem";

import { useTheme } from "@/hooks/useTheme";

export default function GroupScreen() {
  const router = useRouter();
  const { data: chats, isLoading, refetch } = useChats();
  const [search, setSearch] = useState("");
  const { colors, isDark } = useTheme();

  const groupChats = chats?.filter((chat) => chat.isGroupChat) || [];
  const filteredGroups = groupChats.filter((group) =>
    group.name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Groups
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
              placeholder="Search groups..."
              placeholderTextColor={colors.grey}
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
          <ChatItem
            chat={item}
            onPress={() => router.push(`/chat/${item._id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyUI
            title={search ? "No results found" : "No chats yet"}
            subtitle={
              search ? "No groups found" : "You haven't joined any groups yet"
            }
            iconName="people-outline"
            iconColor={colors.grey}
            iconSize={64}
            buttonLabel="New Group"
            onPressButton={() => router.push("/screens/select_participates")}
          />
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: isDark ? colors.primary : "#000",
          },
        ]}
        onPress={() => router.push("/screens/select_participates")}
      >
        <Ionicons
          name="add"
          size={30}
          color={isDark ? colors.background : colors.white}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {},
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
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: "center",
    alignItems: "center",
  },
});
