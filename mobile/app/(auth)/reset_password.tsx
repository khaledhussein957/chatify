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
import { COLORS } from "@/constants/theme";
import { styles } from "@/assets/styles/auth.style";
import { router } from "expo-router";
import { useResetPassword, useResendResetCode } from "@/hooks/useAuth";
import { useState } from "react";
import { useAlert } from "@/components/AlertMessageController"; // ✅ import alert

// Joi schema for reset password
const resetPasswordSchema = Joi.object({
  resetCode: Joi.string().length(6).required().messages({
    "string.empty": "Reset code is required",
    "string.length": "Reset code must be 6 digits",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.empty": "New password is required",
    "string.min": "Password must be at least 8 characters",
  }),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
});

type ResetPasswordFormData = {
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
};

const ResetPasswordScreen = () => {
  const route = useRoute();
  const email = (route.params as { email?: string } | undefined)?.email;

  /* HOOKS */
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

  /* RESET PASSWORD */
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      alert.error("❌ Missing reset email.");
      return;
    }
    try {
      await resetPassword({
        email,
        resetCode: data.resetCode,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      alert.success("✅ Password reset successfully!");
      router.replace("/(auth)");
    } catch (error: any) {
      console.error("Reset Error:", error);

      const msg =
        error?.response?.data?.message || "❌ Failed to reset password.";
      alert.error(msg);
    }
  };

  /* RESEND RESET CODE */
  const handleResendCode = async () => {
    if (!email) {
      alert.error("❌ Missing reset email.");
      return;
    }
    try {
      await resendCode(email);
      alert.success("✅ Reset code sent to your email!");
    } catch (error: any) {
      console.error("Resend Error:", error);

      const msg = error?.response?.data?.message || "❌ Failed to resend code.";
      alert.error(msg);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* BRAND / TITLE */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Ionicons
                name="chatbubble-ellipses"
                size={32}
                color={COLORS.primary}
              />
              <Text style={[styles.appName, { marginTop: 8 }]}>
                Reset Password
              </Text>
            </View>

            <Text
              style={{ marginBottom: 12, fontSize: 16, color: COLORS.grey }}
            >
              Reset password for:{" "}
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                {email}
              </Text>
            </Text>

            {/* Reset Code */}
            <Controller
              control={control}
              name="resetCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Reset Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter reset code"
                    placeholderTextColor={COLORS.grey}
                    keyboardType="numeric"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                  {errors.resetCode && (
                    <Text style={styles.errorText}>
                      {errors.resetCode.message}
                    </Text>
                  )}

                  {/* Resend Code */}
                  <Pressable
                    disabled={isResending}
                    onPress={handleResendCode}
                    style={{
                      marginTop: 8,
                      alignSelf: "flex-end",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: COLORS.primary,
                      borderRadius: 8,
                    }}
                  >
                    {isResending ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <Text
                        style={{ color: COLORS.background, fontWeight: "600" }}
                      >
                        Resend Code
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            />

            {/* New Password */}
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Enter new password"
                      placeholderTextColor={COLORS.grey}
                      secureTextEntry={!showPassword}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color={COLORS.grey}
                      />
                    </Pressable>
                  </View>
                  {errors.newPassword && (
                    <Text style={styles.errorText}>
                      {errors.newPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Confirm new password"
                      placeholderTextColor={COLORS.grey}
                      secureTextEntry={!showConfirmPassword}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={22}
                        color={COLORS.grey}
                      />
                    </Pressable>
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Reset Button */}
            <Pressable
              disabled={isSubmitting || isResetting}
              style={styles.formButton}
              onPress={handleSubmit(onSubmit)}
            >
              {isSubmitting || isResetting ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.formButtonText}>Reset Password</Text>
              )}
            </Pressable>

            {/* Back to Login */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <Text style={{ color: COLORS.grey }}>
                Remember your password?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)")}>
                <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                  Login
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ResetPasswordScreen;
