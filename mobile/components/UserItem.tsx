import type { User } from "@/types";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/theme";

type UserItemProps = {
  user: User;
  isOnline: boolean;
  onPress: () => void;
};

/**
 * Render a pressable user list item showing avatar, name, email, and an optional online indicator.
 *
 * @param user - The user data to display (avatar, name, email).
 * @param isOnline - If true, show a small online badge on the avatar and an "Online" label.
 * @param onPress - Callback invoked when the item is pressed.
 * @returns The rendered React element for the user item.
 */
function UserItem({ user, isOnline, onPress }: UserItemProps) {
  const hasAvatar = Boolean(user.avatar);
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        opacity: 1,
      }}
      android_ripple={{ color: COLORS.surfaceLight }}
    >
      {/* Avatar & online indicator */}
      <View style={{ position: "relative" }}>
        {hasAvatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 48, height: 48, borderRadius: 999 }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: COLORS.surfaceLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: COLORS.foreground, fontWeight: "600" }}>
              {initial}
            </Text>
          </View>
        )}
        {isOnline && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              backgroundColor: COLORS.primary,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: COLORS.surfaceCard,
            }}
          />
        )}
      </View>

      {/* User info */}
      <View
        style={{
          flex: 1,
          marginLeft: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.surfaceLight,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: COLORS.foreground,
              fontWeight: "500",
              fontSize: 16,
            }}
            numberOfLines={1}
          >
            {user.name}
          </Text>
          {isOnline && (
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 12,
                fontWeight: "500",
              }}
            >
              Online
            </Text>
          )}
        </View>
        <Text
          style={{
            color: COLORS.grey,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {user.email}
        </Text>
      </View>
    </Pressable>
  );
}

export default UserItem;