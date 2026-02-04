import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";

import { useAuthStore } from "@/store/auth";
import { useUpdateProfile, useUpdateProfileAvatar } from "@/hooks/useUser";
import { styles } from "@/assets/styles/profile.style";
import { COLORS } from "@/constants/theme";
import { editProfileSchema } from "@/validators/editProfile.validator";

type FormValues = {
  name: string;
  email: string;
};

const EditProfile = () => {
  const { user, updateUser } = useAuthStore();

  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateProfileAvatar();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: joiResolver(editProfileSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      updateAvatar.mutate(
        {
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: asset.fileName || "avatar.jpg",
        },
        {
          onSuccess: (data) => {
            if (user) {
              updateUser({ ...user, avatar: data.avatar });
            }
          },
        },
      );
    }
  };

  const onSubmit = (values: FormValues) => {
    updateProfile.mutate(values, {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        router.back();
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.pageHeader, { marginTop: 20 }]}>
        <Pressable onPress={() => router.back()} style={{ width: 40 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.pageTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}>
          {/* Avatar */}
          <View style={styles.avatarHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <Image
                  source={
                    user?.avatar
                      ? user.avatar
                      : "https://ui-avatars.com/api/?name=User&background=0D0D0F&color=22C55E"
                  }
                  style={styles.avatar}
                />
              </View>

              <Pressable
                style={styles.cameraButton}
                onPress={handlePickImage}
              >
                {updateAvatar.isPending ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Ionicons
                    name="camera"
                    size={18}
                    color={COLORS.background}
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <View style={{ marginTop: 40 }}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.grey}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.grey}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={[
                styles.saveButton,
                (!isValid || updateProfile.isPending) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;
