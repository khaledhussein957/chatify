import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/theme";
import { useUserStatuses, useViewStatus } from "@/hooks/useStatus";
import { useAuthStore } from "@/store/auth";

const { width } = Dimensions.get("window");

const ViewStatusScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const currentUser = useAuthStore((state) => state.user);

  const userId = params.userId as string | undefined;

  const { data: statuses, isLoading } = useUserStatuses(userId);
  const { mutate: markViewed } = useViewStatus();

  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<Video | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const sortedStatuses = useMemo(
    () => (statuses ? [...statuses].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)) : []),
    [statuses],
  );

  const currentStatus = sortedStatuses[currentIndex];

  // Mark as viewed when current status changes
  useEffect(() => {
    if (currentStatus && currentUser?._id) {
      if (!currentStatus.viewers.includes(currentUser._id)) {
        markViewed(currentStatus._id);
      }
    }
  }, [currentStatus?._id, currentStatus?.viewers, currentUser?._id, markViewed]);

  // Reset video playback when status changes
  useEffect(() => {
    setIsVideoPlaying(true);
  }, [currentStatus?._id]);

  const handleNext = () => {
    if (currentIndex < sortedStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  if (!userId) {
    return null;
  }

  const isVideo =
    !!currentStatus?.mediaUrl && currentStatus?.mediaType === "video";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.overlay}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="close" size={22} color={COLORS.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={styles.userName}>
                {currentStatus?.user.name || "Status"}
              </Text>
              <Text style={styles.counterText}>
                {sortedStatuses.length > 0
                  ? `${currentIndex + 1} / ${sortedStatuses.length}`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {isLoading || !currentStatus ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <>
              {isVideo ? (
                <View style={styles.statusTapArea}>
                  {/* LEFT ARROW */}
                  <TouchableOpacity
                    style={styles.navArrowLeft}
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={COLORS.foreground}
                    />
                  </TouchableOpacity>

                  <Video
                    ref={videoRef}
                    source={{ uri: currentStatus.mediaUrl! }}
                    style={styles.media}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isVideoPlaying}
                    isLooping
                    useNativeControls
                    onPlaybackStatusUpdate={(status) => {
                      if ("isPlaying" in status) {
                        setIsVideoPlaying(status.isPlaying);
                      }
                    }}
                  />

                  {/* RIGHT ARROW */}
                  <TouchableOpacity
                    style={styles.navArrowRight}
                    onPress={handleNext}
                    disabled={currentIndex >= sortedStatuses.length - 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.foreground}
                    />
                  </TouchableOpacity>

                  {currentStatus.text && (
                    <View style={styles.captionContainer}>
                      <Text style={styles.captionText} numberOfLines={3}>
                        {currentStatus.text}
                      </Text>
                    </View>
                  )}

                  <View style={styles.viewersBadge}>
                    <Ionicons name="eye" size={14} color={COLORS.foreground} />
                    <Text style={styles.viewersText}>
                      {currentStatus.viewers.length}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statusTapArea}>
                {/* Add a tap layer behind content for next/prev */}
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={handleNext}
                  onLongPress={handlePrev}
                />
                  {/* LEFT ARROW */}
                  <TouchableOpacity
                    style={styles.navArrowLeft}
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={COLORS.foreground}
                    />
                  </TouchableOpacity>

                  {currentStatus.mediaUrl ? (
                    <Image
                      source={{ uri: currentStatus.mediaUrl }}
                      style={styles.media}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.textStatus}>
                      <Text style={styles.textStatusText}>
                        {currentStatus.text || "Status"}
                      </Text>
                    </View>
                  )}

                  {currentStatus.text && currentStatus.mediaUrl && (
                    <View style={styles.captionContainer}>
                      <Text style={styles.captionText} numberOfLines={3}>
                        {currentStatus.text}
                      </Text>
                    </View>
                  )}

                  {/* VIEWERS COUNT */}
                  <TouchableOpacity
                    style={styles.navArrowRight}
                    onPress={handleNext}
                    disabled={currentIndex >= sortedStatuses.length - 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.foreground}
                    />
                  </TouchableOpacity>

                  <View style={styles.viewersBadge}>
                    <Ionicons name="eye" size={14} color={COLORS.foreground} />
                    <Text style={styles.viewersText}>
                      {currentStatus.viewers.length}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  overlay: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    marginRight: 10,
  },
  userName: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  counterText: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTapArea: {
    width: width * 0.9,
    height: width * 1.3,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  textStatus: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  textStatusText: {
    color: COLORS.foreground,
    fontSize: 20,
    textAlign: "center",
  },
  captionContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  captionText: {
    color: COLORS.foreground,
    fontSize: 14,
  },
  viewersBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  viewersText: {
    color: COLORS.foreground,
    fontSize: 12,
  },
  navArrowLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  navArrowRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
});

export default ViewStatusScreen;