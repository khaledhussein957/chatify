import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "@/constants/theme";

interface StatusCardProps {
  name: string;
  avatar?: string;
  hasUnseen: boolean;
  isOwn?: boolean;
  onPress: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  name,
  avatar,
  hasUnseen,
  isOwn,
  onPress,
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.avatarRing,
          hasUnseen ? styles.avatarRingUnseen : styles.avatarRingSeen,
        ]}
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {isOwn ? "My Status" : name}
        </Text>
        <Text style={styles.subtitle}>
          {isOwn
            ? hasUnseen
              ? "Tap to add a status update"
              : "Tap to view your updates"
            : hasUnseen
            ? "New updates"
            : "Viewed"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarRingUnseen: {
    borderColor: COLORS.primary,
  },
  avatarRingSeen: {
    borderColor: COLORS.surfaceLight,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: COLORS.foreground,
    fontWeight: "600",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 2,
  },
});

export default StatusCard;
