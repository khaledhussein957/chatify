import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Text,
} from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { COLORS } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface MediaViewerProps {
  isVisible: boolean;
  onClose: () => void;
  mediaUrl: string;
  type: "image" | "video" | "document";
}

const MediaViewer = ({ isVisible, onClose, mediaUrl, type }: MediaViewerProps) => {
  const handleOpenDocument = async () => {
    await WebBrowser.openBrowserAsync(mediaUrl);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={32} color={COLORS.white} />
          </Pressable>
        </SafeAreaView>

        <View style={styles.content}>
          {type === "image" && (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.fullImage}
              contentFit="contain"
            />
          )}

          {type === "video" && (
            <Video
              source={{ uri: mediaUrl }}
              style={styles.fullVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          )}

          {type === "document" && (
            <View style={styles.documentCenter}>
              <Ionicons name="document-text" size={100} color={COLORS.primary} />
              <Text style={styles.documentLabel}>Document File</Text>
              <Pressable style={styles.openBtn} onPress={handleOpenDocument}>
                <Text style={styles.openBtnText}>Open in Browser</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MediaViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    zIndex: 10,
    position: "absolute",
    top: 40,
    right: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width,
    height: height,
  },
  fullVideo: {
    width: width,
    height: height,
  },
  documentCenter: {
    alignItems: "center",
    gap: 20,
  },
  documentLabel: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  openBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  openBtnText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "700",
  },
});
