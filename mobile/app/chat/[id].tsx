import EmptyUI from "@/components/EmptyItem";
import MessageBubble from "@/components/MessageBubble";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useMessages,
  useSendMessageWithContent,
  useSendVoiceMessage,
  useUpdateTextMessage,
  useDeleteMessage,
} from "@/hooks/useMessage";
import { useChats } from "@/hooks/useChat";
import { useSocketStore } from "@/lib/socket";
import { useCallStore } from "@/store/call";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";

import { COLORS } from "@/constants/theme";
import { Message } from "@/types";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";

type ChatParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
};

const ChatDetailScreen = () => {
  const { colors, isDark } = useTheme();
  const {
    id: chatId,
    avatar,
    name,
    participantId,
  } = useLocalSearchParams<ChatParams>();

  const alert = useAlert();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  // Selection & Editing State
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Voice Recording & Playback State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null,
  );
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;
  const isRecordingRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancellingRef = useRef(false);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRecordRef = useRef(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sendMessageWithFile = useSendMessageWithContent();
  const sendVoiceMessage = useSendVoiceMessage();
  const updateTextMessage = useUpdateTextMessage();
  const deleteMessage = useDeleteMessage();
  const queryClient = useQueryClient();

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(chatId);
  const { data: chats } = useChats();

  const chat = chats?.find((c) => c._id === chatId);

  const {
    joinChat,
    leaveChat,
    sendMessage,
    sendActivity,
    isConnected,
    onlineUsers,
    activityUsers,
  } = useSocketStore();

  const isGroup = chat?.isGroupChat || false;

  const chatActivityMap = activityUsers.get(chatId);
  const activityUserIds = chatActivityMap
    ? Array.from(chatActivityMap.keys())
    : [];
  const hasActivity = activityUserIds.length > 0;

  let activityTextString = "";
  if (hasActivity && chatActivityMap) {
    const entries = Array.from(chatActivityMap.values());
    if (entries.length === 1) {
      activityTextString = `${entries[0].name} is ${entries[0].activity}...`;
    } else if (entries.length === 2) {
      activityTextString = `${entries[0].name} and ${entries[1].name} are active...`;
    } else {
      activityTextString = `${entries[0].name} and ${entries.length - 1} others are active...`;
    }
  }

  let isOnline = false;
  if (isGroup && chat) {
    // Count online participants excluding current user
    const onlineParticipantsCount = chat.participants.filter((p) => {
      const pId = typeof p === "string" ? p : p._id;
      return pId !== currentUser?._id && onlineUsers.has(pId);
    }).length;
    isOnline = onlineParticipantsCount >= 1;
  } else if (participantId) {
    isOnline = onlineUsers.has(participantId);
  }

  const setCallStatus = useCallStore((state) => state.setCallStatus);

  const handleCall = () => {
    if (!isConnected) {
      alert.error("You are offline");
      return;
    }
    setCallStatus({
      isCalling: true,
      chatId,
      role: "caller",
      isGroupCall: isGroup,
      receiver: participantId
        ? { _id: participantId, name: name || "User", avatar: avatar || "" }
        : null,
    });
  };

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatId && isConnected) joinChat(chatId);
    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleActivity = useCallback(
    (text: string) => {
      setMessageText(text);
      if (!isConnected || !chatId) return;

      if (text.length > 0) {
        sendActivity(chatId, "typing");
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          sendActivity(chatId, "none");
        }, 2000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendActivity(chatId, "none");
      }
    },
    [chatId, isConnected, sendActivity],
  );

  const pickImage = async () => {
    setIsAttachmentModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type:
            asset.mimeType ||
            (asset.type === "video" ? "video/mp4" : "image/jpeg"),
          name:
            asset.fileName ||
            `media_${Date.now()}${asset.type === "video" ? ".mp4" : ".jpg"}`,
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      alert.error("Failed to select image. Please check permissions.");
    }
  };

  const pickDocument = async () => {
    setIsAttachmentModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type: asset.mimeType || "application/octet-stream",
          name: asset.name,
        });
      }
    } catch (error) {
      console.error("Document picker error:", error);
      alert.error("Failed to select document. Please check permissions.");
    }
  };

  const handleAttachment = () => {
    setIsAttachmentModalVisible(true);
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
  };

  const handleLongPress = (message: any) => {
    if (message.deleted) return;
    const senderId =
      typeof message.sender === "string" ? message.sender : message.sender._id;
    if (senderId === currentUser?._id) {
      setSelectedMessageId(message._id);
    }
  };

  const clearSelection = () => {
    setSelectedMessageId(null);
    setIsEditingMode(false);
    setMessageText("");
  };

  const handleDeleteSelected = () => {
    if (!selectedMessageId) return;

    alert.confirm(
      "Are you sure you want to delete this message?",
      async () => {
        const messageId = selectedMessageId;
        try {
          // Optimistic delete (soft delete)
          queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
            return old?.map((m) =>
              m._id === messageId ? { ...m, deleted: true, text: "" } : m,
            );
          });

          await deleteMessage(messageId);
          clearSelection();
          alert.success("Message deleted");
        } catch (error) {
          console.log(error);
          // Rollback or invalidate on error
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          alert.error("Failed to delete message");
        }
      },
      { confirmText: "Delete", confirmColor: COLORS.error },
    );
  };

  const handleEditSelected = () => {
    if (!selectedMessageId) return;
    const msg = messages?.find((m) => m._id === selectedMessageId);
    if (msg) {
      // check if message is too old to edit
      const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
      if (timeDiff > 5 * 60 * 1000) {
        alert.error("This message is too old to edit");
        clearSelection();
        return;
      }

      setMessageText(msg.text || "");
      setIsEditingMode(true);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert.error("Permission to access microphone is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;

      // Check if user already released during setup
      if (!shouldRecordRef.current) {
        console.log("User released during recording setup, aborting...");
        await recording.stopAndUnloadAsync();
        recordingRef.current = null;
        return;
      }

      setIsRecording(true);
      isRecordingRef.current = true;
      setIsCancelling(false);
      isCancellingRef.current = false;
      swipeX.setValue(0);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();
      sendActivity(chatId, "recording");

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert.error("Failed to start recording");
    }
  };

  const stopRecording = async (shouldCancel = false) => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsCancelling(false);
      isCancellingRef.current = false;
      swipeX.setValue(0);
      sendActivity(chatId, "none");
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      const finalDuration = recordingStartTimeRef.current
        ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        : recordingDuration;

      recordingRef.current = null;
      recordingStartTimeRef.current = null;

      if (uri && !shouldCancel) {
        if (finalDuration < 1) {
          console.log("Recording too short, discarding...");
          // alert.info("Hold to record");
        } else {
          handleSendVoice(uri, finalDuration);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        shouldRecordRef.current = true;
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
        longPressTimeout.current = setTimeout(() => {
          if (shouldRecordRef.current) {
            startRecording();
          }
        }, 200);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRecordingRef.current && gestureState.dx < 0) {
          swipeX.setValue(gestureState.dx);
          if (gestureState.dx < -80) {
            setIsCancelling(true);
            isCancellingRef.current = true;
          } else {
            setIsCancelling(false);
            isCancellingRef.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        shouldRecordRef.current = false;
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }

        if (isRecordingRef.current) {
          if (gestureState.dx < -80) {
            stopRecording(true);
          } else {
            stopRecording(false);
          }
        }
      },
      onPanResponderTerminate: () => {
        shouldRecordRef.current = false;
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
        if (isRecordingRef.current) {
          stopRecording(true);
        }
      },
    }),
  ).current;

  const handleSendVoice = async (uri: string, duration: number) => {
    try {
      console.log("Preparing to send voice message:", { uri, duration });
      setIsSending(true);
      await sendVoiceMessage(
        chatId,
        {
          uri,
          type: "audio/m4a",
          name: `voice_${Date.now()}.m4a`,
        },
        duration,
      );
      console.log("Voice message sent successfully!");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to send voice message:", error);
      alert.error("Failed to send voice message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedFile) || !currentUser) {
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendActivity(chatId, "none");

    try {
      setIsSending(true);

      if (isEditingMode && selectedMessageId) {
        const messageId = selectedMessageId;
        const newText = messageText.trim();
        const originalText = messages?.find((m) => m._id === messageId)?.text;

        // Optimistic update
        queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
          return old?.map((m) =>
            m._id === messageId ? { ...m, text: newText } : m,
          );
        });

        try {
          await updateTextMessage(messageId, newText);
          clearSelection();
        } catch (error) {
          console.log(error);
          // Rollback optimistic update
          queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
            return old?.map((m) =>
              m._id === messageId ? { ...m, text: originalText || "" } : m,
            );
          });
          alert.error("Failed to update message");
        }
      } else if (selectedFile) {
        // Send with file
        await sendMessageWithFile(
          chatId,
          messageText.trim() || "",
          selectedFile,
        );
        setSelectedFile(null);
        setMessageText("");
      } else if (isConnected) {
        // Send text only via socket
        sendMessage(chatId, messageText.trim());
        setMessageText("");
      } else {
        // Fallback: Send text via HTTP if socket is disconnected
        console.log("Socket disconnected, sending via HTTP fallback...");
        await sendMessageWithFile(chatId, messageText.trim());
        setMessageText("");
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Send failed:", error);
      alert.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (selectedMessageId ? clearSelection() : router.back())}
        >
          <Ionicons
            name={selectedMessageId ? "close" : "arrow-back"}
            size={24}
            color={colors.primary}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          {!selectedMessageId ? (
            <>
              {avatar && <Image source={avatar} style={styles.avatar} />}
              <View style={styles.headerText}>
                <Text
                  style={[styles.name, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text
                  style={[
                    styles.status,
                    hasActivity && styles.typing,
                    { color: colors.grey },
                  ]}
                >
                  {hasActivity
                    ? activityTextString
                    : isOnline
                      ? "Online"
                      : "Offline"}
                </Text>
              </View>
            </>
          ) : (
            <Text
              style={[styles.headerTitleSelected, { color: colors.foreground }]}
            >
              {isEditingMode ? "Editing Message" : "Message Selected"}
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {!selectedMessageId ? (
            <Pressable style={styles.iconBtn} onPress={handleCall}>
              <Ionicons name="call-outline" size={24} color={colors.primary} />
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.iconBtn} onPress={handleEditSelected}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={handleDeleteSelected}>
                <Ionicons name="trash" size={20} color={colors.error} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.flex}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !messages?.length ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor={colors.grey}
              iconSize={64}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.messages}
            >
              {messages.map((message) => {
                const senderId =
                  typeof message.sender === "string"
                    ? message.sender
                    : message.sender._id;

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isFromMe={senderId === currentUser?._id}
                    showSenderName={isGroup}
                    onLongPress={() => handleLongPress(message)}
                    isSelected={selectedMessageId === message._id}
                    playingId={currentlyPlayingId}
                    onTogglePlay={setCurrentlyPlayingId}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* Input */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.surfaceLight,
              },
            ]}
          >
            {selectedFile && (
              <View style={styles.filePreview}>
                <View style={styles.filePreviewContent}>
                  {selectedFile.type.startsWith("image") ? (
                    <Image
                      source={{ uri: selectedFile.uri }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.fileIcon}>
                      <Ionicons
                        name={
                          selectedFile.type.includes("pdf")
                            ? "document-text"
                            : "document"
                        }
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <Text
                    style={[styles.fileName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRemoveAttachment}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={24} color={colors.grey} />
                </Pressable>
              </View>
            )}

            <View
              style={[styles.inputBar, { backgroundColor: colors.surfaceCard }]}
            >
              <Pressable style={styles.addBtn} onPress={handleAttachment}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>

              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder={isRecording ? "Recording..." : "Type a message"}
                placeholderTextColor={colors.grey}
                multiline
                value={
                  isRecording
                    ? `Recording: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, "0")}`
                    : messageText
                }
                onChangeText={handleActivity}
                editable={!isRecording}
              />

              {!messageText.trim() && !selectedFile ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {isRecording && (
                    <Animated.Text
                      style={{
                        position: "absolute",
                        right: 50,
                        color: isCancelling ? colors.error : colors.grey,
                        fontSize: 12,
                        width: 100,
                        textAlign: "right",
                        opacity: swipeX.interpolate({
                          inputRange: [-100, -50, 0],
                          outputRange: [1, 0.8, 0.5],
                        }),
                      }}
                    >
                      {isCancelling ? "Release to cancel" : "< Slide to cancel"}
                    </Animated.Text>
                  )}
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.sendBtn,
                      {
                        transform: [{ translateX: swipeX }],
                        backgroundColor: isCancelling
                          ? colors.error
                          : colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={20}
                      color={isDark ? colors.background : colors.white}
                    />
                  </Animated.View>
                </View>
              ) : (
                <Pressable
                  style={[
                    styles.sendBtn,
                    !messageText.trim() && !selectedFile && { opacity: 0.5 },
                  ]}
                  onPress={handleSend}
                  disabled={!messageText.trim() && !selectedFile}
                >
                  {isSending ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? colors.background : colors.white}
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={18}
                      color={isDark ? colors.background : colors.white}
                    />
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Selection Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAttachmentModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAttachmentModalVisible(false)}
        >
          <View
            style={[
              styles.attachmentModal,
              { backgroundColor: colors.surfaceCard },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Share
            </Text>

            <View style={styles.attachmentOptions}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={pickImage}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: "#6C5DD3" }]}
                >
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={pickDocument}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: "#FFA928" }]}
                >
                  <Ionicons name="document-text" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  Document
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setIsAttachmentModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { marginLeft: 12 },
  name: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  status: { fontSize: 12, color: COLORS.grey },
  typing: { color: COLORS.primary },
  recording: { color: COLORS.error },

  headerTitleSelected: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 12,
  },

  headerActions: { flexDirection: "row", gap: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  messages: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  inputWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  filePreviewContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },
  removeBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  attachmentModal: {
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  attachmentOptions: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 24,
  },
  attachmentOption: {
    alignItems: "center",
    gap: 8,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  optionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },
  closeModalBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    marginTop: 8,
  },
  closeModalText: {
    color: COLORS.grey,
    fontSize: 16,
    fontWeight: "600",
  },
});
