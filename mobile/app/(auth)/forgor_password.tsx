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
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { COLORS } from "@/constants/theme";
import { styles } from "@/assets/styles/auth.style";
import { router } from "expo-router";
import { useForgotPassword } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/components/AlertMessageController"; // ✅ use alert

// Joi schema for email validation
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Enter a valid email",
    }),
});

type ForgotPasswordFormData = {
  email: string;
};

const ForgotPasswordScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: joiResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutateAsync: forgotPassword, isPending } = useForgotPassword();

  const alert = useAlert();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);

      // ✅ Success alert
      alert.success(`✅ Reset link sent to ${data.email}. Check your inbox!`);

      router.push({
        pathname: "/(auth)/reset_password",
        params: { email: data.email },
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);

      // ✅ Error alert
      const msg =
        error?.response?.data?.message || "❌ Failed to send reset link.";
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
            {/* BRAND SECTION */}
            <View style={styles.brandSection}>
              <View style={styles.logoContainer}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.appName}>Forgot Password</Text>
            </View>

            {/* Instruction */}
            <Text
              style={{ marginBottom: 12, fontSize: 16, color: COLORS.grey }}
            >
              Enter your email to receive a password reset link
            </Text>

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.grey}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Submit Button */}
            <Pressable
              disabled={isSubmitting || isPending}
              style={styles.formButton}
              onPress={handleSubmit(onSubmit)}
            >
              {isSubmitting || isPending ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.formButtonText}>Send Reset Link</Text>
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

export default ForgotPasswordScreen;
