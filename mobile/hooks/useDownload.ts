import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useState } from "react";

import * as Haptics from "expo-haptics";
import { useAlert } from "@/components/AlertMessageController";

import * as Sentry from "@sentry/react-native";

export type MediaType = "image" | "video" | "document";

export const useDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const alert = useAlert();

  const downloadMedia = async (url: string, type: MediaType) => {
    if (!url) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const filename = url.split("/").pop()?.split("?")[0] || "file";
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Create download resumable for progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        },
      );

      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error("Download failed");
      }

      if (type === "image" || type === "video") {
        const { status } = await MediaLibrary.requestPermissionsAsync(true); // Request write-only permissions
        if (status !== "granted") {
          alert.show(
            "Please grant access to the media library to download photos/videos.",
          );
          return;
        }

        await MediaLibrary.saveToLibraryAsync(result.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert.success("Media saved to gallery successfully.");
      } else {
        // Handle documents via sharing (allows saving to files, etc)
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        } else {
          alert.success("File downloaded successfully.");
        }
      }
    } catch (error) {
      console.error("Download Error:", error);
      Sentry.captureException(error, {
        tags: { area: "download", type },
        extra: { url },
      });
      alert.error(
        "An error occurred while downloading the file. Please try again.",
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return { downloadMedia, isDownloading, downloadProgress };
};
