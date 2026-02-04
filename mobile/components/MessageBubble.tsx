import React, { useState } from "react";
import { Message } from "@/types";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS } from "@/constants/theme";
import { format } from "date-fns";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import MediaViewer from "./MediaViewer";


function MessageBubble({
  message,
  isFromMe,
  onLongPress,
  isSelected,
}: {
  message: Message;
  isFromMe: boolean;
  onLongPress?: () => void;
  isSelected?: boolean;
}) {
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const time = message.createdAt 
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  const contentPath = message.content?.split("?")[0].toLowerCase();
  const isImage = !!contentPath && /\.(jpg|jpeg|png|gif|webp)$/.test(contentPath);
  const isVideo = !!contentPath && /\.(mp4|mov)$/.test(contentPath);

  const isDocument = message.content && !isImage && !isVideo;

  const mediaType = isImage ? "image" : isVideo ? "video" : "document";

  return (
    <View
      style={[
        styles.row,
        isFromMe ? styles.justifyEnd : styles.justifyStart,
      ]}
    >
      <Pressable
        onLongPress={message.deleted ? undefined : onLongPress}
        style={[
          styles.bubble,
          isFromMe ? styles.bubbleMe : styles.bubbleOther,
          isSelected && styles.selectedBubble,
          message.deleted && styles.bubbleDeleted,
        ]}
      >
        {/* Media Content */}
        {message.content && !message.deleted && (
          <>
            {isImage && (
              <Pressable onPress={() => setIsViewerVisible(true)}>
                <Image source={{ uri: message.content }} style={styles.mediaImage} />
              </Pressable>
            )}
            
            {isVideo && (
              <Pressable onPress={() => setIsViewerVisible(true)} style={styles.videoContainer}>
                <Ionicons name="play-circle" size={48} color={COLORS.white} />
              </Pressable>
            )}
            
            {isDocument && (
              <Pressable onPress={() => setIsViewerVisible(true)} style={styles.documentContainer}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
                <Text style={styles.documentText}>Document</Text>
              </Pressable>
            )}

            <MediaViewer 
              isVisible={isViewerVisible}
              onClose={() => setIsViewerVisible(false)}
              mediaUrl={message.content}
              type={mediaType}
            />
          </>
        )}
        
        {/* Text */}
        {message.deleted ? (
          <Text style={[styles.text, styles.deletedText]}>
            🚫 This message was deleted
          </Text>
        ) : (
          message.text && (
            <Text
              style={[
                styles.text,
                isFromMe ? styles.textMe : styles.textOther,
                message.content && { marginTop: 4 },
              ]}
            >
              {message.text}
            </Text>
          )
        )}
        
        {/* Time */}
        {!message.deleted && (
          <Text
            style={[
              styles.time,
              isFromMe ? styles.timeMe : styles.timeOther,
            ]}
          >
            {time}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default MessageBubble;


const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  justifyEnd: {
    justifyContent: "flex-end",
  },
  justifyStart: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 0,
  },
  bubbleDeleted: {
    backgroundColor: "rgba(255, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  selectedBubble: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "rgba(108, 93, 211, 0.2)",
  },
  text: {
    fontSize: 14,
  },
  deletedText: {
    color: COLORS.grey,
    fontStyle: "italic",
    fontSize: 13,
  },
  textMe: {
    color: COLORS.background,
  },
  textOther: {
    color: COLORS.white,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeMe: {
    color: "rgba(13, 13, 15, 0.5)",
  },
  timeOther: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentText: {
    color: COLORS.white,
    fontSize: 14,
  },
});
