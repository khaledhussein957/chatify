import { Chat } from "@/types";
import { Image } from "expo-image";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { format } from "date-fns";
import { useSocketStore } from "@/lib/socket";
import { useCurrentUser } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const ChatItem = ({
  chat,
  onPress,
  onLongPress,
}: {
  chat: Chat;
  onPress: () => void;
  onLongPress?: () => void;
}) => {
  const participant = chat.participant;
  const { onlineUsers, activityUsers, unreadChats } = useSocketStore();
  const { data: currentUser } = useCurrentUser();
  const { colors } = useTheme();

  const isOnline = chat.isGroupChat
    ? chat.participants.some((p) => {
        const pId = typeof p === "string" ? p : p._id;
        return pId !== currentUser?._id && onlineUsers.has(pId);
      })
    : participant
      ? onlineUsers.has(participant._id)
      : false;

  const chatActivityMap = activityUsers.get(chat._id);
  const firstActiveEntry = chatActivityMap
    ? Array.from(chatActivityMap.values())[0]
    : null;

  const getActivityText = () => {
    if (!firstActiveEntry) return null;
    const { activity, name } = firstActiveEntry;

    if (chat.isGroupChat) {
      const activeCount = chatActivityMap?.size || 0;
      return activeCount === 1
        ? `${name} is ${activity}...`
        : "People are active...";
    }

    return activity === "typing" ? "typing..." : "recording...";
  };

  const activityText = getActivityText();

  const hasUnread = unreadChats.has(chat._id);

  const displayName = chat.isGroupChat ? chat.name : participant?.name;
  const displayAvatar = chat.isGroupChat
    ? `https://ui-avatars.com/api/?name=${chat.name}&background=random`
    : participant?.avatar;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Avatar & online indicator */}
      <View style={styles.avatarWrapper}>
        <Image source={displayAvatar} style={styles.avatar} />
        {isOnline && (
          <View
            style={[
              styles.onlineIndicator,
              {
                backgroundColor: colors.primary,
                borderColor: colors.background,
              },
            ]}
          />
        )}
      </View>

      {/* Chat info */}
      <View style={styles.info}>
        <View style={styles.row}>
          <Text
            style={[
              styles.name,
              { color: colors.foreground },
              hasUnread && { color: colors.primary, fontWeight: "600" },
            ]}
          >
            {displayName}
          </Text>

          <View style={styles.row}>
            {hasUnread && (
              <View
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            )}
            <Text style={[styles.time, { color: colors.grey }]}>
              {chat.lastMessageAt
                ? format(new Date(chat.lastMessageAt), "h:mm a")
                : ""}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.row,
            { marginTop: 4, justifyContent: "space-between" },
          ]}
        >
          {activityText ? (
            <Text style={[styles.typingText, { color: colors.primary }]}>
              {activityText}
            </Text>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                hasUnread
                  ? { color: colors.foreground, fontWeight: "500" }
                  : { color: colors.grey },
                chat.lastMessage?.deleted && [
                  styles.deletedText,
                  { color: colors.grey },
                ],
              ]}
              numberOfLines={1}
            >
              {chat.lastMessage?.deleted
                ? "🚫 Message was deleted"
                : chat.lastMessage?.type === "voice"
                  ? "Voice message 🎤"
                  : chat.lastMessage?.text ||
                    (chat.lastMessage?.content
                      ? chat.lastMessage.content.match(
                          /\.(jpg|jpeg|png|webp|gif)(\?|$)/i,
                        )
                        ? "Photo 📸"
                        : chat.lastMessage.content.match(
                              /\.(mp4|mov|avi|mkv|webm)(\?|$)/i,
                            )
                          ? "Video 📹"
                          : "File 📁"
                      : "No messages yet 📝")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ChatItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
  },

  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 16,
  },

  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },

  typingText: {
    fontSize: 14,
    fontStyle: "italic",
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },

  time: {
    fontSize: 12,
  },
  deletedText: {
    fontStyle: "italic",
  },
});
