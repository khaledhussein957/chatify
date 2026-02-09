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
import { useCompleteProfile, useUpdateProfileAvatar } from "@/hooks/useUser";
import { getProfileStyles } from "@/assets/styles/profile.style";
import { useTheme } from "@/hooks/useTheme";
import { editProfileSchema } from "@/validators/editProfile.validator";
import { useAlert } from "@/components/AlertMessageController";

type FormValues = {
  name: string;
  email: string;
};

const CompleteProfile = () => {
  const { colors, isDark } = useTheme();
  const styles = getProfileStyles(colors);
  const { user, updateUser } = useAuthStore();
  const alert = useAlert();

  const completeProfile = useCompleteProfile();
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
          onSuccess: (data: any) => {
            if (user) {
              updateUser({ ...user, avatar: data.avatar });
            }
          },
        },
      );
    }
  };

  const onSubmit = (values: FormValues) => {
    completeProfile.mutate(values, {
      onSuccess: (data: any) => {
        updateUser(data.user);
        if (user && !user.name) {
          // If this was initial setup (onboarding), go to tabs
          if (router.canDismiss()) router.dismissAll();
          router.replace("/(tabs)");
        } else {
          router.back();
        }
      },
      onError: (error: any) => {
        alert.error(error.message);
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.pageHeader, { marginTop: 20 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Complete Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: 20 },
          ]}
        >
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

              <Pressable style={styles.cameraButton} onPress={handlePickImage}>
                {updateAvatar.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={isDark ? colors.background : colors.white}
                  />
                ) : (
                  <Ionicons
                    name="camera"
                    size={18}
                    color={isDark ? colors.background : colors.white}
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <View style={{ marginTop: 40 }}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Full Name
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceCard,
                        color: colors.foreground,
                        borderColor: colors.surfaceLight,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.grey}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceCard,
                        color: colors.foreground,
                        borderColor: colors.surfaceLight,
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.grey}
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
                (!isValid || completeProfile.isPending) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || completeProfile.isPending}
            >
              {completeProfile.isPending ? (
                <ActivityIndicator
                  color={isDark ? colors.background : colors.white}
                />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isDark ? colors.background : colors.white },
                  ]}
                >
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CompleteProfile;
