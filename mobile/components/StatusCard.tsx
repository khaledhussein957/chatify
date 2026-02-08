import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/useTheme";

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
  const { colors } = useTheme();
  const initials =
    name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.avatarRing,
          { borderColor: hasUnseen ? colors.primary : colors.surfaceLight },
        ]}
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <Text
              style={[styles.avatarFallbackText, { color: colors.foreground }]}
            >
              {initials}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {isOwn ? "My Status" : name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.grey }]}>
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    fontWeight: "600",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default StatusCard;
