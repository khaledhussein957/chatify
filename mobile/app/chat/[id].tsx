import EmptyUI from "@/components/EmptyItem";
import MessageBubble from "@/components/MessageBubble";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMessages, useSendMessageWithContent, useUpdateTextMessage, useDeleteMessage } from "@/hooks/useMessage";
import { useSocketStore } from "@/lib/socket";
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
  ActionSheetIOS,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";

import { COLORS } from "@/constants/theme";
import { Message } from "@/types";
import { useAlert } from "@/components/AlertMessageController";

type ChatParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
};

const ChatDetailScreen = () => {
  const { id: chatId, avatar, name, participantId } =
    useLocalSearchParams<ChatParams>();

  const alert = useAlert();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  
  // Selection & Editing State
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sendMessageWithFile = useSendMessageWithContent();
  const updateTextMessage = useUpdateTextMessage();
  const deleteMessage = useDeleteMessage();
  const queryClient = useQueryClient();

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(chatId);

  const {
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    isConnected,
    onlineUsers,
    typingUsers,
  } = useSocketStore();

  const isOnline = participantId ? onlineUsers.has(participantId) : false;
  const isTyping = typingUsers.get(chatId) === participantId;

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

  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);
      if (!isConnected || !chatId) return;

      if (text.length > 0) {
        sendTyping(chatId, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(chatId, false);
        }, 2000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTyping(chatId, false);
      }
    },
    [chatId, isConnected, sendTyping],
  );

  const handleAttachment = async () => {
    const options = ["Photos & Videos", "Document", "Cancel"];
    
    const showPicker = (index: number) => {
      if (index === 0) {
        // Photos & Videos
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.8,
          allowsEditing: false,
        }).then((result) => {
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedFile({
              uri: asset.uri,
              type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
              name: asset.fileName || `media_${Date.now()}${asset.type === "video" ? ".mp4" : ".jpg"}`,
            });
          }
        }).catch((error) => {
          console.error("Image picker error:", error);
          alert.error("Failed to select image. Please check permissions.");
         });
      } else if (index === 1) {
        // Document
        DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        }).then((result) => {
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedFile({
              uri: asset.uri,
              type: asset.mimeType || "application/octet-stream",
              name: asset.name,
            });
          }
        }).catch((error) => {
          console.error("Document picker error:", error);
          alert.error("Failed to select document. Please check permissions.");
         });
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        showPicker
      );
    } else {
      Alert.alert("Choose attachment type", "", [
        { text: "Photos & Videos", onPress: () => showPicker(0) },
        { text: "Document", onPress: () => showPicker(1) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
  };

  const handleLongPress = (message: any) => {
    if (message.deleted) return;
    const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
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
              m._id === messageId ? { ...m, deleted: true, text: "" } : m
            );
          });

          await deleteMessage(messageId);
          clearSelection();
          alert.success("Message deleted");
        } catch (error) {
          // Rollback or invalidate on error
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          alert.error("Failed to delete message");
        }
      },
      { confirmText: "Delete", confirmColor: COLORS.error }
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

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedFile) || !currentUser) {
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(chatId, false);

    try {
      setIsSending(true);

      if (isEditingMode && selectedMessageId) {
        const messageId = selectedMessageId;
        const newText = messageText.trim();
        const originalText = messages?.find((m) => m._id === messageId)?.text;

        // Optimistic update
        queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
          return old?.map((m) =>
            m._id === messageId ? { ...m, text: newText } : m
          );
        });

        try {
          await updateTextMessage(messageId, newText);
          clearSelection();
        } catch (error) {
          // Rollback optimistic update
          queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
            return old?.map((m) =>
              m._id === messageId ? { ...m, text: originalText || "" } : m
            );
          });
          alert.error("Failed to update message");
          throw error; // Re-throw to hit outer catch if needed
        }
      } else if (selectedFile) {
        // Send with file
        await sendMessageWithFile(
          chatId,
          messageText.trim() || "",
          selectedFile
        );
        setSelectedFile(null);
        setMessageText("");
      } else if (isConnected) {
        // Send text only via socket
        sendMessage(chatId, messageText.trim(), {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar as string,
        });
        setMessageText("");
      } else {
        alert.error("Unable to send message.");
        return;
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => (selectedMessageId ? clearSelection() : router.back())}>
          <Ionicons 
            name={selectedMessageId ? "close" : "arrow-back"} 
            size={24} 
            color={COLORS.primary} 
          />
        </Pressable>

        <View style={styles.headerCenter}>
          {!selectedMessageId ? (
            <>
              {avatar && <Image source={avatar} style={styles.avatar} />}
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.status, isTyping && styles.typing]}>
                  {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.headerTitleSelected}>
              {isEditingMode ? "Editing Message" : "Message Selected"}
            </Text>
          )}
        </View>

        {selectedMessageId && (
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={handleEditSelected}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={handleDeleteSelected}>
              <Ionicons name="trash" size={20} color={COLORS.error} />
            </Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.flex}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : !messages?.length ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor={COLORS.grey}
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
                    onLongPress={() => handleLongPress(message)}
                    isSelected={selectedMessageId === message._id}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* Input */}
          <View style={styles.inputWrapper}>
            {selectedFile && (
              <View style={styles.filePreview}>
                <View style={styles.filePreviewContent}>
                  {selectedFile.type.startsWith("image") ? (
                    <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.fileIcon}>
                      <Ionicons 
                        name={selectedFile.type.includes("pdf") ? "document-text" : "document"} 
                        size={32} 
                        color={COLORS.primary} 
                      />
                    </View>
                  )}
                  <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                </View>
                <Pressable onPress={handleRemoveAttachment} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={24} color={COLORS.grey} />
                </Pressable>
              </View>
            )}
            
            <View style={styles.inputBar}>
              <Pressable style={styles.addBtn} onPress={handleAttachment}>
                <Ionicons name="add" size={22} color={COLORS.primary} />
              </Pressable>

              <TextInput
                style={styles.input}
                placeholder="Type a message"
                placeholderTextColor={COLORS.grey}
                multiline
                value={messageText}
                onChangeText={handleTyping}
              />

              <Pressable
                style={[
                  styles.sendBtn,
                  (!messageText.trim() && !selectedFile) && { opacity: 0.5 }
                ]}
                onPress={handleSend}
                disabled={!messageText.trim() && !selectedFile}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.background} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});
