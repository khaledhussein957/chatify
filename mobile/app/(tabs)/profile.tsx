import { useAuth, useUser } from "@clerk/clerk-expo";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/assets/styles/profile.style";

const ACCOUNT_ITEMS = [
  { icon: "person-outline", label: "Edit Profile", color: "#22C55E" },
  { icon: "shield-checkmark-outline", label: "Privacy & Security", color: "#22C55E" },
  { icon: "notifications-outline", label: "Notifications", value: "On", color: "#22C55E" },
];

const ProfileTab = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBorder}>
              <Image
                source={user?.imageUrl}
                style={styles.avatar}
              />
            </View>

            <Pressable style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color={styles.container.backgroundColor} />
            </Pressable>
          </View>

          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>

          <Text style={styles.email}>
            {user?.emailAddresses[0]?.emailAddress}
          </Text>

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
              >
                <View
                  style={[
                    styles.sectionIconWrapper,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.sectionLabel}>{item.label}</Text>
                {item.value && (
                  <Text style={styles.sectionValue}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color="#6B6B70" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <Pressable style={styles.logoutButton} onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default ProfileTab;
