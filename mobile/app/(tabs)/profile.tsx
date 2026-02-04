import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { styles } from "@/assets/styles/profile.style";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { useUpdateProfileAvatar } from "@/hooks/useUser";
import { COLORS } from "@/constants/theme";
import { router } from "expo-router";
import { useAlert } from "@/components/AlertMessageController";

const ACCOUNT_ITEMS = [
  { icon: "person-outline", label: "Edit Profile", color: "#22C55E", route: "/screens/edit_profile" },
  {
    icon: "lock-closed-outline",
    label: "Change Password",
    color: "#22C55E",
    route: "/screens/change_password"
  },
  {
    icon: "trash-outline",
    label: "Delete Account",
    color: "#EF4444",
    route: "/screens/delete_account"
  },
];

const ProfileTab = () => {
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { mutateAsync: updateAvatar, isPending: isUpdatingAvatar } = useUpdateProfileAvatar();
  const alert = useAlert();

  const handleLogout = () => {
    logout();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      try {
        const response = await updateAvatar({
          uri: asset.uri,
          name: asset.fileName || "avatar.jpg",
          type: asset.mimeType || "image/jpeg",
        });
        
        // Update local user state with new avatar URL
        if (user && response.avatar) {
          updateUser({ ...user, avatar: response.avatar });
        }
      } catch (error) {
        console.error("Failed to update avatar:", error);
        alert.error("Failed to update profile picture");
      }
    }
  };

  // Helper to determine if avatar is a URL or a letter
  const isAvatarUrl = (avatar?: string) => {
    return avatar && (avatar.startsWith("http") || avatar.startsWith("file"));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBorder, { overflow: "hidden", justifyContent: "center", alignItems: "center", backgroundColor: isAvatarUrl(user?.avatar) ? "transparent" : COLORS.primary }]}>
             {isUpdatingAvatar ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : isAvatarUrl(user?.avatar) ? (
                <Image source={{ uri: user?.avatar }} style={styles.avatar} />
              ) : (
                <Text style={{ fontSize: 40, color: "white", fontWeight: "bold" }}>
                  {user?.avatar || user?.name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <Pressable style={styles.cameraButton} onPress={pickImage} disabled={isUpdatingAvatar}>
              <Ionicons
                name="camera"
                size={16}
                color={styles.container.backgroundColor}
              />
            </Pressable>
          </View>

          <Text style={styles.name}>
            {user?.name}
          </Text>

          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.onlineStatusContainer}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* ACCOUNT SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            {ACCOUNT_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.sectionItem,
                  index < ACCOUNT_ITEMS.length - 1 && styles.sectionItemBorder,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View
                  style={[
                    styles.sectionIconWrapper,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                </View>
                <Text style={styles.sectionLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#6B6B70" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default ProfileTab;
