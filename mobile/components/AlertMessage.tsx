import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

export type AlertMessageHandles = {
  show: (message: string, type: "success" | "error" | "info") => void;
  hide: () => void;
};

type AlertMessageProps = {
  onHide?: () => void;
  duration?: number;
};

const AlertMessage = forwardRef<AlertMessageHandles, AlertMessageProps>(
  ({ onHide, duration = 10000 }, ref) => {
    const { colors } = useTheme();
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<"success" | "error" | "info">("success");

    const translateY = useSharedValue(-80);
    const opacity = useSharedValue(0);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const insets = useSafeAreaInsets();

    const hideAlert = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      translateY.value = withTiming(-80, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setMessage)(null);
        if (onHide) runOnJS(onHide)();
      });
    };

    useImperativeHandle(ref, () => ({
      show: (msg, alertType) => {
        setMessage(msg);
        setType(alertType);

        translateY.value = withTiming(0, { duration: 400 });
        opacity.value = withTiming(1, { duration: 400 });

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => hideAlert(), duration);
      },
      hide: hideAlert,
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    if (!message) return null;

    return (
      <Animated.View
        accessibilityRole="alert"
        style={[
          animatedStyle,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: type === "success" ? colors.success : colors.error,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            position: "absolute",
            top: insets.top + 10,
            left: 20,
            right: 20,
            zIndex: 9999,
          },
        ]}
      >
        <Text
          style={{
            color: colors.white,
            fontWeight: "bold",
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          {message}
        </Text>

        <TouchableOpacity onPress={hideAlert} style={{ marginLeft: 12 }}>
          <Ionicons name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

AlertMessage.displayName = "AlertMessage";

export default AlertMessage;
