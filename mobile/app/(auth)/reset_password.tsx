// Reset Password Screen (UPDATED UI)

import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { useRoute } from "@react-navigation/native";
import { getAuthStyles } from "@/assets/styles/auth.style";
import { router } from "expo-router";
import { useResetPassword, useResendResetCode } from "@/hooks/useAuth";
import { useState } from "react";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";

const resetPasswordSchema = Joi.object({
  resetCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required(),
});

type ResetPasswordFormData = {
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
};

const ResetPasswordScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = getAuthStyles(colors);
  const route = useRoute();
  const email = (route.params as { email?: string })?.email;

  const { mutateAsync: resendCode, isPending: isResending } =
    useResendResetCode();
  const { mutateAsync: resetPassword, isPending: isResetting } =
    useResetPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: joiResolver(resetPasswordSchema),
    defaultValues: { resetCode: "", newPassword: "", confirmPassword: "" },
  });

  const alert = useAlert();

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) return alert.error("Missing reset email");

    try {
      await resetPassword({ email, ...data });
      alert.success("Password reset successfully");
      router.replace("/(auth)");
    } catch (error: any) {
      console.log(error);
      // Show error alert
      const msg =
        error?.response?.data?.message || "❌ Reset failed. Try again.";
      alert.error(msg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* RESET CODE */}
            <Controller
              control={control}
              name="resetCode"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Reset Code</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceCard,
                        borderColor: colors.surfaceLight,
                        color: colors.foreground,
                      },
                    ]}
                    keyboardType="numeric"
                    placeholder="Enter reset code"
                    placeholderTextColor={colors.grey}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.resetCode && (
                    <Text style={styles.errorText}>
                      {errors.resetCode.message}
                    </Text>
                  )}
                  {/* RESEND (UPDATED) */}
                  <Pressable
                    disabled={isResending}
                    onPress={() => resendCode(email!)}
                    style={{
                      alignSelf: "flex-end",
                      marginTop: 6,
                      opacity: isResending ? 0.6 : 1,
                    }}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        Resend code
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            />

            {/* NEW PASSWORD */}
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surfaceCard,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.surfaceLight,
                    }}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: "transparent",
                          borderWidth: 0,
                          color: colors.foreground,
                          paddingRight: 44,
                        },
                      ]}
                      secureTextEntry={!showPassword}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.grey}
                      value={value}
                      onChangeText={onChange}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                      style={{
                        paddingHorizontal: 12,
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.grey}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            />

            {/* CONFIRM PASSWORD */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surfaceCard,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.surfaceLight,
                    }}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: "transparent",
                          borderWidth: 0,
                          color: colors.foreground,
                          paddingRight: 44,
                        },
                      ]}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.grey}
                      value={value}
                      onChangeText={onChange}
                    />
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      hitSlop={10}
                      style={{
                        paddingHorizontal: 12,
                        justifyContent: "center",
                      }}
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
                </View>
              )}
            />

            {/* SUBMIT */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              style={styles.formButton}
              disabled={isSubmitting || isResetting}
            >
              {isSubmitting || isResetting ? (
                <ActivityIndicator
                  color={isDark ? colors.background : colors.white}
                />
              ) : (
                <Text style={styles.formButtonText}>Reset Password</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ResetPasswordScreen;
