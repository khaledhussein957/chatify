import { Chat } from "@/types";
import { Image } from "expo-image";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { format } from "date-fns";
import { useSocketStore } from "@/lib/socket";
import { COLORS } from "@/constants/theme";

const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => {
  const participant = chat.participant;
  const { onlineUsers, typingUsers, unreadChats } = useSocketStore();

  const isOnline = onlineUsers.has(participant._id);
  const isTyping = typingUsers.get(chat._id) === participant._id;
  const hasUnread = unreadChats.has(chat._id);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Avatar & online indicator */}
      <View style={styles.avatarWrapper}>
        <Image source={participant.avatar} style={styles.avatar} />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Chat info */}
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={[styles.name, hasUnread && { color: COLORS.primary, fontWeight: "600" }]}>
            {participant.name}
          </Text>

          <View style={styles.row}>
            {hasUnread && <View style={styles.unreadDot} />}
            <Text style={styles.time}>
              {chat.lastMessageAt
                ? format(new Date(chat.lastMessageAt), "h:mm a")
                : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { marginTop: 4, justifyContent: "space-between" }]}>
          {isTyping ? (
            <Text style={styles.typingText}>typing...</Text>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                hasUnread ? { color: COLORS.foreground, fontWeight: "500" } : { color: COLORS.grey },
                chat.lastMessage?.deleted && styles.deletedText,
              ]}
              numberOfLines={1}
            >
              {chat.lastMessage?.deleted ? (
                "🚫 Message was deleted"
              ) : (
                chat.lastMessage?.text ||
                (chat.lastMessage?.content ? (
                  chat.lastMessage.content.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
                    ? "Photo 📸"
                    : chat.lastMessage.content.match(/\.(mp4|mov|avi|mkv|webm)(\?|$)/i)
                    ? "Video 📹"
                    : "File 📁"
                ) : "No messages yet 📝")
              )}
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
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
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
    color: COLORS.foreground,
  },

  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },

  typingText: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.primary,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },

  time: {
    fontSize: 12,
    color: COLORS.grey,
  },
  deletedText: {
    fontStyle: "italic",
    color: COLORS.grey,
  },
});
