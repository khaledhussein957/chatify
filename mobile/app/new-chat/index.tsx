import UserItem from "@/components/UserItem";
import { useGetOrCreateChat } from "@/hooks/useChat";
import { useUsers } from "@/hooks/useUser";
import { useSocketStore } from "@/lib/socket";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";

const NewChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers, isLoading } = useUsers();
  const { mutate: getOrCreateChat, isPending: isCreatingChat } =
    useGetOrCreateChat();
  const { onlineUsers } = useSocketStore();

  // client-side filtering
  const users = allUsers?.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  });

  const handleUserSelect = (user: User) => {
    getOrCreateChat(user._id, {
      onSuccess: (chat) => {
        router.dismiss(); // go -1
        setTimeout(() => {
          router.push({
            pathname: "/chat/[id]",
            params: {
              id: chat._id,
              participantId: chat.participant._id,
              name: chat.participant.name,
              avatar: chat.participant.avatar,
            },
          });
        }, 100);
      },
      onError: (error) => {
        // Consider showing an alert or toast
        console.error("Failed to create chat:", error);
      },
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={["top"]}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background + "40",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.surfaceCard,
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
              backgroundColor: COLORS.surfaceCard,
            }}
          >
            <Pressable
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
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.foreground,
                  fontSize: 20,
                  fontWeight: "600",
                }}
              >
                New chat
              </Text>
              <Text style={{ color: COLORS.grey, fontSize: 12, marginTop: 2 }}>
                Search for a user to start chatting
              </Text>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: COLORS.surfaceCard,
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
                placeholder="Search users"
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

          {/* USERS LIST */}
          <View style={{ flex: 1, backgroundColor: COLORS.surfaceCard }}>
            {isCreatingChat || isLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : !users || users.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 20,
                }}
              >
                <Ionicons name="person-outline" size={64} color={COLORS.grey} />
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
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 24,
                }}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={{ color: COLORS.grey, fontSize: 12, marginBottom: 8 }}
                >
                  USERS
                </Text>
                {users.map((user) => (
                  <UserItem
                    key={user._id}
                    user={user}
                    isOnline={onlineUsers.has(user._id)}
                    onPress={() => handleUserSelect(user)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NewChatScreen;
