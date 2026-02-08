import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useCreateStatus } from "@/hooks/useStatus";

const { width } = Dimensions.get("window");

const PreviewContentScreen = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    type?: string;
    mimeType?: string;
    fileName?: string;
    duration?: string;
  }>();

  const uri = params.uri as string | undefined;
  const type = params.type as string | undefined;
  const mimeType = params.mimeType as string | undefined;
  const fileName = params.fileName as string | undefined;
  const durationParam = params.duration as string | undefined;

  const isVideo =
    (mimeType && mimeType.startsWith("video/")) || type === "video";

  const [caption, setCaption] = useState("");

  const { mutate: createStatus, isPending: isPosting } = useCreateStatus();

  const shouldRedirect = !uri || !mimeType || !fileName;

  useEffect(() => {
    if (shouldRedirect) {
      router.back();
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return null;
  }

  const handlePost = () => {
    const durationSeconds = durationParam ? Number(durationParam) : undefined;

    createStatus(
      {
        text: caption.trim() || undefined,
        media: {
          uri,
          type: mimeType,
          name: fileName,
          duration: durationSeconds,
        },
      },
      {
        onSuccess: () => {
          setCaption("");
          router.back();
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isPosting}
          >
            <Ionicons name="close" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Preview
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {/* CONTENT PREVIEW */}
        <View style={styles.content}>
          {isVideo ? (
            <Video
              source={{ uri }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image source={{ uri }} style={styles.media} contentFit="cover" />
          )}
        </View>

        {/* CAPTION + ACTIONS */}
        <View
          style={[
            styles.bottomSheet,
            {
              borderTopColor: colors.surfaceLight,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.captionWrapper,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <TextInput
              style={[styles.captionInput, { color: colors.foreground }]}
              placeholder="Add a caption..."
              placeholderTextColor={colors.grey}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.cancelButton,
                { backgroundColor: colors.surfaceLight },
              ]}
              onPress={() => router.back()}
              disabled={isPosting}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.postButton,
                { backgroundColor: colors.primary },
                isPosting && { opacity: 0.5 },
              ]}
              onPress={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator
                  color={isDark ? colors.background : colors.white}
                />
              ) : (
                <Text
                  style={[
                    styles.postText,
                    { color: isDark ? colors.background : colors.white },
                  ]}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: width * 0.9,
    height: width * 1.2,
    borderRadius: 24,
    overflow: "hidden",
  },
  bottomSheet: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  captionWrapper: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 15,
    minHeight: 40,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionButton: {
    minWidth: 90,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  cancelButton: {},
  postButton: {},
  cancelText: {
    fontWeight: "500",
  },
  postText: {
    fontWeight: "600",
  },
});

export default PreviewContentScreen;
