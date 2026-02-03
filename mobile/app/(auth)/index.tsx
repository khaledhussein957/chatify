import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
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
import { COLORS } from "@/constants/theme";
import { styles } from "@/assets/styles/auth.style";
import { router } from "expo-router";
import { useUserLogin } from "@/hooks/useAuth";
import { useState } from "react";
import { useAlert } from "../../components/AlertMessageController";

// Joi schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Enter a valid email",
    }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
  }),
});

type LoginFormData = {
  email: string;
  password: string;
};

const AuthScreen = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: joiResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutateAsync: login, isPending: isLoggingIn } = useUserLogin();

  const alert = useAlert(); // 👈 access alert

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      if (router.canDismiss()) router.dismissAll();
      router.replace("/(tabs)");

      // Optional success alert
      alert.success("✅ Logged in successfully!");
    } catch (error: any) {
      console.error("Login Error:", error);

      // Show error alert
      const message =
        error?.response?.data?.message || "❌ Login failed. Please try again.";
      alert.error(message);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* IMAGE */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../assets/images/social-signIn.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            <View style={{ flex: 1, justifyContent: "center" }}>
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
                      autoCorrect={false}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Password */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={COLORS.grey}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                      <Pressable
                        style={{
                          position: "absolute",
                          right: 16,
                          top: 14,
                          padding: 4,
                        }}
                        onPress={() => setShowPassword((prev) => !prev)}
                      >
                        <Ionicons
                          name={showPassword ? "eye" : "eye-off"}
                          size={20}
                          color={COLORS.grey}
                        />
                      </Pressable>
                    </View>
                    {errors.password && (
                      <Text style={styles.errorText}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Forgot password */}
              <Pressable onPress={() => router.push("/(auth)/forgot_password")}>
                <Text
                  style={[
                    styles.termsText,
                    { textAlign: "right", marginTop: 8 },
                  ]}
                >
                  Forgot Password?
                </Text>
              </Pressable>

              {/* Login button */}
              <Pressable
                disabled={isSubmitting || isLoggingIn}
                style={styles.formButton}
                onPress={handleSubmit(onSubmit)}
              >
                {isSubmitting || isLoggingIn ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.formButtonText}>Login</Text>
                )}
              </Pressable>

              {/* Register */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <Text style={{ color: COLORS.grey }}>
                  Don’t have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                    Register
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.termsText, { marginTop: 16 }]}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default AuthScreen;
