import React, { useState, useEffect, useRef } from "react";
import { Message } from "@/types";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import MediaViewer from "./MediaViewer";
import { Audio, AVPlaybackStatus } from "expo-av";

function MessageBubble({
  message,
  isFromMe,
  onLongPress,
  isSelected,
  showSenderName,
  playingId,
  onTogglePlay,
}: {
  message: Message;
  isFromMe: boolean;
  onLongPress?: () => void;
  isSelected?: boolean;
  showSenderName?: boolean;
  playingId?: string | null;
  onTogglePlay?: (id: string | null) => void;
}) {
  const { colors, isDark } = useTheme();
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const time = message.createdAt
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  const contentPath = message.content?.split("?")[0].toLowerCase();
  const isImage =
    message.type === "image" ||
    (!message.type &&
      !!contentPath &&
      /\.(jpg|jpeg|png|gif|webp)$/.test(contentPath));
  const isVoice = message.type === "voice";
  const isVideo =
    (message.type === "video" ||
      (!message.type && !!contentPath && /\.(mp4|mov)$/.test(contentPath))) &&
    !isVoice;

  const isDocument = message.content && !isImage && !isVideo && !isVoice;

  const mediaType = isImage ? "image" : isVideo ? "video" : "document";

  // Stop playback if another message starts playing
  useEffect(() => {
    if (playingId !== message._id && isPlaying) {
      pauseAudio();
    }
  }, [playingId, message._id, isPlaying]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        soundRef.current?.stopAsync();
        soundRef.current?.setPositionAsync(0);
        if (onTogglePlay && playingId === message._id) {
          onTogglePlay(null);
        }
      }
    }
  };

  const pauseAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };

  const togglePlayback = async () => {
    if (!message.content) return;

    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          if (onTogglePlay) onTogglePlay(null);
        } else {
          // If we are starting play, tell the parent
          if (onTogglePlay) onTogglePlay(message._id);
          await soundRef.current.playAsync();
        }
      } else {
        setIsLoadingAudio(true);
        if (onTogglePlay) onTogglePlay(message._id);

        const { sound } = await Audio.Sound.createAsync(
          { uri: message.content },
          { shouldPlay: true },
          onPlaybackStatusUpdate,
        );
        soundRef.current = sound;
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsLoadingAudio(false);
      if (onTogglePlay) onTogglePlay(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View
      style={[styles.row, isFromMe ? styles.justifyEnd : styles.justifyStart]}
    >
      <Pressable
        onLongPress={message.deleted ? undefined : onLongPress}
        style={[
          styles.bubble,
          isFromMe
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : {
                backgroundColor: colors.surfaceLight,
                borderBottomLeftRadius: 0,
              },
          isSelected && {
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: isDark
              ? "rgba(108, 93, 211, 0.2)"
              : "rgba(108, 93, 211, 0.1)",
          },
          message.deleted && {
            backgroundColor: isDark
              ? "rgba(255, 68, 68, 0.05)"
              : "rgba(255, 68, 68, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(255, 68, 68, 0.2)",
          },
        ]}
      >
        {/* Sender Name for Group Chats */}
        {showSenderName && !isFromMe && !message.deleted && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {typeof message.sender === "string"
              ? "Someone"
              : message.sender.name}
          </Text>
        )}

        {/* Media Content */}
        {message.content && !message.deleted && (
          <>
            {isImage && (
              <Pressable onPress={() => setIsViewerVisible(true)}>
                <Image
                  source={{ uri: message.content }}
                  style={styles.mediaImage}
                />
              </Pressable>
            )}

            {isVideo && (
              <Pressable
                onPress={() => setIsViewerVisible(true)}
                style={[
                  styles.videoContainer,
                  { backgroundColor: colors.surfaceLight },
                ]}
              >
                <Ionicons name="play-circle" size={48} color={colors.white} />
              </Pressable>
            )}

            {isVoice && (
              <View style={styles.voiceContainer}>
                <Pressable onPress={togglePlayback} style={styles.voicePlayBtn}>
                  {isLoadingAudio ? (
                    <ActivityIndicator
                      size="small"
                      color={isFromMe ? colors.background : colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={24}
                      color={isFromMe ? colors.background : colors.primary}
                    />
                  )}
                </Pressable>
                <View style={styles.voiceProgressContainer}>
                  <View
                    style={[
                      styles.voiceProgressBar,
                      { backgroundColor: "rgba(128, 128, 128, 0.2)" },
                    ]}
                  >
                    <View
                      style={[
                        styles.voiceProgressFill,
                        {
                          width: `${(playbackPosition / ((message.duration || 0) * 1000)) * 100}%`,
                          backgroundColor: isFromMe
                            ? colors.background
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.voiceDuration,
                      {
                        color: isFromMe ? colors.background : colors.foreground,
                        opacity: 0.7,
                      },
                    ]}
                  >
                    {formatDuration(message.duration || 0)}
                  </Text>
                </View>
              </View>
            )}

            {isDocument && (
              <Pressable
                onPress={() => setIsViewerVisible(true)}
                style={[
                  styles.documentContainer,
                  { backgroundColor: colors.surfaceLight },
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={24}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.documentText,
                    { color: isFromMe ? colors.background : colors.foreground },
                  ]}
                >
                  Document
                </Text>
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
          <Text
            style={[styles.text, styles.deletedText, { color: colors.grey }]}
          >
            🚫 This message was deleted
          </Text>
        ) : (
          message.text && (
            <Text
              style={[
                styles.text,
                {
                  color: isFromMe
                    ? colors.background
                    : isDark
                      ? colors.white
                      : colors.foreground,
                },
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
              {
                color: isFromMe
                  ? "rgba(0,0,0,0.4)"
                  : isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.3)",
              },
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

  text: {
    fontSize: 14,
  },
  deletedText: {
    fontStyle: "italic",
    fontSize: 13,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentText: {
    fontSize: 14,
  },
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 150,
    paddingVertical: 4,
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceProgressContainer: {
    flex: 1,
    gap: 4,
  },
  voiceProgressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  voiceProgressFill: {
    height: "100%",
  },
  voiceDuration: {
    fontSize: 10,
  },
});
