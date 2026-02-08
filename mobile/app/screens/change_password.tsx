import React, { useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";

import { useChangePassword } from "@/hooks/useUser";
import { getProfileStyles } from "@/assets/styles/profile.style";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";
import { changePasswordSchema } from "@/validators/changePassword.validator";

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePassword = () => {
  const { colors, isDark } = useTheme();
  const styles = getProfileStyles(colors);
  const alert = useAlert();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: joiResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit = (values: FormValues) => {
    changePassword.mutate(values, {
      onSuccess: (data: any) => {
        alert.success(data.message || "Password updated successfully");
        router.back();
      },
      onError: (error: any) => {
        alert.error(
          error.response?.data?.message || "Failed to update password",
        );
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
        <Pressable onPress={() => router.back()} style={{ width: 40 }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Change Password
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
          <View style={{ marginTop: 40 }}>
            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Current Password
              </Text>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: colors.surfaceCard,
                          color: colors.foreground,
                          borderColor: colors.surfaceLight,
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.grey}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showCurrentPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={colors.grey}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.currentPassword && (
                <Text style={styles.errorText}>
                  {errors.currentPassword.message}
                </Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                New Password
              </Text>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: colors.surfaceCard,
                          color: colors.foreground,
                          borderColor: colors.surfaceLight,
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.grey}
                      secureTextEntry={!showNewPassword}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={colors.grey}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.newPassword && (
                <Text style={styles.errorText}>
                  {errors.newPassword.message}
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Confirm New Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: colors.surfaceCard,
                          color: colors.foreground,
                          borderColor: colors.surfaceLight,
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.grey}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={colors.grey}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={[
                styles.saveButton,
                (!isValid || changePassword.isPending) && { opacity: 0.7 },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || changePassword.isPending}
            >
              {changePassword.isPending ? (
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
                  Update Password
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePassword;
