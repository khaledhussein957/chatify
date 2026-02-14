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
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { getAuthStyles } from "@/assets/styles/auth.style";
import { useVerifyCode, useResendCode } from "@/hooks/useAuth";
import { useAlert } from "@/components/AlertMessageController";
import { useTheme } from "@/hooks/useTheme";
import { getDeviceId } from "@/utils/device";

// Joi schema
const verifySchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.empty": "Code is required",
    "string.length": "Code must be 6 digits",
    "string.pattern.base": "Code must contain only numbers",
  }),
});

type VerifyFormData = {
  code: string;
};

const VerifyAccountScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = getAuthStyles(colors);
  const { phone, exists, name, email, avatar } = useLocalSearchParams<{
    phone?: string;
    exists?: string;
    name?: string;
    email?: string;
    avatar?: string;
  }>();
  const alert = useAlert();
  const [deviceId, setDeviceId] = useState<string>("");

  const { mutateAsync: verifyAccount, isPending: isLoading } = useVerifyCode();

  const { mutateAsync: resendCode, isPending: isResending } = useResendCode();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    resolver: joiResolver(verifySchema),
    defaultValues: { code: "" },
  });

  // Get device ID on component mount
  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const onSubmit = async (data: VerifyFormData) => {
    if (!phone) {
      alert.error("Phone number is missing");
      return;
    }

    try {
      const res = await verifyAccount({
        phone: phone,
        code: data.code,
        deviceId: deviceId,
      });

      if (res?.token) {
        alert.success("✅ Account verified successfully");

        if (router.canDismiss()) router.dismissAll();
        if (res.profileCompleted) {
          router.replace("/(tabs)");
        } else {
          router.replace("/screens/complete_profile");
        }
      } else {
        alert.error("❌ Verification failed");
      }
    } catch (error: any) {
      alert.error(
        error?.response?.data?.message || "❌ Failed to verify account",
      );
    }
  };

  const handleResend = async () => {
    if (!phone) {
      alert.error("Phone number is missing");
      return;
    }

    try {
      const res = await resendCode({ phone });

      if (res?.message) {
        alert.success(res.message || "✅ Code resent successfully");
      } else {
        alert.error(res?.message || "❌ Failed to resend code");
      }
    } catch {
      alert.error("❌ Failed to resend code");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* IMAGE */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../assets/images/social-signIn.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* TITLE / WELCOME BACK */}
            {exists === "true" ? (
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Image
                  source={
                    avatar ||
                    `https://ui-avatars.com/api/?name=${name}+&background=0D0D0F&color=22C55E`
                  }
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: colors.primary,
                  }}
                />
                <Text
                  style={[
                    styles.title,
                    { color: colors.foreground, fontSize: 24, marginBottom: 4 },
                  ]}
                >
                  Welcome back, {name?.split(" ")[0]}!
                </Text>
                {email ? (
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    {email}
                  </Text>
                ) : null}
                <Text style={[styles.subtitle, { color: colors.grey }]}>
                  Enter the 6-digit code sent to {phone}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.primary }]}>
                  Verify Your Account
                </Text>
                <Text style={[styles.subtitle, { color: colors.grey }]}>
                  Enter the 6-digit code sent to {phone}
                </Text>
              </>
            )}

            {/* CODE INPUT */}
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Verification Code
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        textAlign: "center",
                        letterSpacing: 6,
                        fontSize: 20,
                        backgroundColor: colors.surfaceCard,
                        color: colors.foreground,
                        borderColor: colors.surfaceLight,
                      },
                    ]}
                    placeholder="123456"
                    placeholderTextColor={colors.grey}
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                  {errors.code && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.code.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* VERIFY BUTTON */}
            <Pressable
              disabled={isSubmitting || isLoading}
              style={styles.formButton}
              onPress={handleSubmit(onSubmit)}
            >
              {isSubmitting || isLoading ? (
                <ActivityIndicator
                  color={isDark ? colors.background : colors.white}
                />
              ) : (
                <Text
                  style={[
                    styles.formButtonText,
                    { color: isDark ? colors.background : colors.white },
                  ]}
                >
                  Verify
                </Text>
              )}
            </Pressable>

            {/* RESEND */}
            <Pressable
              disabled={isLoading}
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={handleResend}
            >
              {isResending ? (
                <ActivityIndicator
                  color={isDark ? colors.background : colors.white}
                />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  Resend Code
                </Text>
              )}
            </Pressable>

            {/* BACK */}
            <Pressable
              style={{ marginTop: 20, alignItems: "center" }}
              onPress={() => router.push("/(auth)")}
            >
              <Text style={{ color: colors.grey }}>Go Back</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default VerifyAccountScreen;
