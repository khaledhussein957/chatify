import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";

import { useTheme } from "@/hooks/useTheme";
import { useCreatePassword } from "@/hooks/useAuth";
import { getProfileStyles } from "@/assets/styles/profile.style";
import { useAlert } from "@/components/AlertMessageController";

const createPasswordSchema = Joi.object({
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
  }),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords must match",
    "any.required": "Confirm password is required",
  }),
});

type FormValues = {
  password: "";
  confirmPassword: "";
};

const CreatePassword = () => {
  const { colors, isDark } = useTheme();
  const styles = getProfileStyles(colors);
  const alert = useAlert();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const createPassword = useCreatePassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: joiResolver(createPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = (values: any) => {
    createPassword.mutate(
      { password: values.password, confirmPassword: values.confirmPassword },
      {
        onSuccess: () => {
          alert.success("Password created successfully!");
          if (router.canDismiss()) router.dismissAll();
          router.replace("/(tabs)");
        },
        onError: (error: any) => {
          alert.error(error.message || "Failed to create password");
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.pageHeader, { marginTop: 20 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Create Password
        </Text>
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
          <View style={{ marginTop: 20 }}>
            <Text
              style={[
                styles.inputLabel,
                { color: colors.grey, marginBottom: 20 },
              ]}
            >
              Please create a strong password to secure your account.
            </Text>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                New Password
              </Text>
              <View
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.surfaceLight,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingRight: 12,
                  },
                ]}
              >
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        flex: 1,
                        color: colors.foreground,
                        height: "100%",
                      }}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter password"
                      placeholderTextColor={colors.grey}
                      secureTextEntry={!showPassword}
                    />
                  )}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.grey}
                  />
                </Pressable>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.surfaceLight,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingRight: 12,
                  },
                ]}
              >
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        flex: 1,
                        color: colors.foreground,
                        height: "100%",
                      }}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Confirm password"
                      placeholderTextColor={colors.grey}
                      secureTextEntry={!showConfirmPassword}
                    />
                  )}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.grey}
                  />
                </Pressable>
              </View>
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
                (!isValid || createPassword.isPending) && styles.disabledButton,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || createPassword.isPending}
            >
              {createPassword.isPending ? (
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
                  Create Password
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePassword;
