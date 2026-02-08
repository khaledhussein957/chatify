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
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { getAuthStyles } from "@/assets/styles/auth.style";
import { router } from "expo-router";
import { useUserRegister } from "@/hooks/useAuth";
import { useAlert } from "@/components/AlertMessageController"; // ✅ import alert
import { validatePhoneNumber } from "@/lib/phoneValidate";
import { useTheme } from "@/hooks/useTheme";

// Joi schema for register validation
const registerSchema = Joi.object({
  phone: Joi.string().required().messages({
    "string.empty": "Phone is required",
  }),
});

type RegisterFormData = {
  phone: string;
};

const RegisterScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = getAuthStyles(colors);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: joiResolver(registerSchema),
    defaultValues: { phone: "" },
  });

  const { mutateAsync: register, isPending: isRegistering } = useUserRegister();

  const alert = useAlert(); // 👈 access alert

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const validation = validatePhoneNumber(data.phone);
      if (!validation?.valid) {
        alert.error(validation?.message || "Invalid phone number");
        return;
      }

      await register(data);

      // Show success alert
      alert.success("✅ Registration successful!");

      if (router.canDismiss()) router.dismissAll();
      router.replace({
        pathname: "/(auth)/verify",
        params: { phone: data.phone },
      });
    } catch (error: any) {
      console.error("Register Error:", error);

      // Show error alert
      const msg =
        error?.response?.data?.message || "❌ Registration failed. Try again.";
      alert.error(msg);
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

            {/* FORM */}
            <View style={{ flex: 1 }}>
              {/* Phone */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      Phone
                    </Text>
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.surfaceCard,
                            color: colors.foreground,
                            borderColor: colors.surfaceLight,
                          },
                        ]}
                        placeholder="Enter your phone"
                        placeholderTextColor={colors.grey}
                        autoCapitalize="none"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    </View>
                    {errors.phone && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.phone.message}
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
                    Register
                  </Text>
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
                <Text style={{ color: colors.grey }}>
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)")}>
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Login
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  styles.termsText,
                  { marginTop: 16, color: colors.grey },
                ]}
              >
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
