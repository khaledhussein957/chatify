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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";

import { useChangePhoneNumber } from "@/hooks/useUser";
import { getProfileStyles } from "@/assets/styles/profile.style";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";
import { changePhoneNumberSchema } from "@/validators/changePhoneNumber.validator";

type FormValues = {
  oldPhone: string;
  newPhone: string;
};

const ChangePassword = () => {
  const { colors, isDark } = useTheme();
  const styles = getProfileStyles(colors);
  const alert = useAlert();
  const changePhoneNumber = useChangePhoneNumber();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: joiResolver(changePhoneNumberSchema),
    mode: "onChange",
  });

  const onSubmit = (values: FormValues) => {
    changePhoneNumber.mutate(values, {
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
          Change Phone Number
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
                Current Phone Number
              </Text>
              <Controller
                control={control}
                name="oldPhone"
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
                      placeholder="Enter current phone number"
                      placeholderTextColor={colors.grey}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              />
              {errors.oldPhone && (
                <Text style={styles.errorText}>{errors.oldPhone.message}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                New Phone Number
              </Text>
              <Controller
                control={control}
                name="newPhone"
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
                      placeholder="Enter new phone number"
                      placeholderTextColor={colors.grey}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              />
              {errors.newPhone && (
                <Text style={styles.errorText}>{errors.newPhone.message}</Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={[
                styles.saveButton,
                (!isValid || changePhoneNumber.isPending) && { opacity: 0.7 },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || changePhoneNumber.isPending}
            >
              {changePhoneNumber.isPending ? (
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
