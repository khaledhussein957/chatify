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
import { useUserRegister } from "@/hooks/useAuth";
import { useState } from "react";
import { useAlert } from "@/components/AlertMessageController"; // ✅ import alert

// Joi schema for register validation
const registerSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
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

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

const RegisterScreen = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: joiResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const { mutateAsync: register, isPending: isRegistering } = useUserRegister();

  const alert = useAlert(); // 👈 access alert

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);

      // Show success alert
      alert.success("✅ Registration successful!");

      if (router.canDismiss()) router.dismissAll();
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Register Error:", error);

      // Show error alert
      const msg =
        error?.response?.data?.message || "❌ Registration failed. Try again.";
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

            {/* FORM */}
            <View style={{ flex: 1 }}>
              {/* Name */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      placeholderTextColor={COLORS.grey}
                      autoCapitalize="words"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>
                        {errors.name.message}
                      </Text>
                    )}
                  </View>
                )}
              />

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

              {/* Register Button */}
              <Pressable
                disabled={isSubmitting || isRegistering}
                style={styles.formButton}
                onPress={handleSubmit(onSubmit)}
              >
                {isSubmitting || isRegistering ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.formButtonText}>Register</Text>
                )}
              </Pressable>

              {/* Login Link */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <Text style={{ color: COLORS.grey }}>
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)")}>
                  <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                    Login
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

export default RegisterScreen;
