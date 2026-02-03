import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Text, TouchableOpacity, View, Modal } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { COLORS } from "@/constants/theme";

export type AlertConfirmHandles = {
  show: (
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; confirmColor?: string }
  ) => void;
  hide: () => void;
};

type AlertConfirmProps = {
  onHide?: () => void;
};

const AlertConfirm = forwardRef<AlertConfirmHandles, AlertConfirmProps>(({ onHide }, ref) => {
  const [message, setMessage] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState<string>("Delete");
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  const colors = {
    card: COLORS.background,
    text: COLORS.text,
    border: COLORS.grey,
    background: COLORS.background,
    error: COLORS.error,
  };

  const hideAlert = () => {
    translateY.value = withTiming(300, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setMessage)(null);
      runOnJS(setOnConfirmCallback)(null);
      if (onHide) runOnJS(onHide)();
    });
  };

  useImperativeHandle(ref, () => ({
    show: (msg, confirmCallback, options) => {
      setMessage(msg);
      setOnConfirmCallback(() => confirmCallback);
      setConfirmText(options?.confirmText || "Delete");
      setConfirmColor(options?.confirmColor);

      translateY.value = withTiming(0, { duration: 400 });
      opacity.value = withTiming(1, { duration: 400 });
    },
    hide: hideAlert,
  }));

  const handleCancel = () => hideAlert();
  const handleConfirm = () => {
    if (onConfirmCallback) onConfirmCallback();
    hideAlert();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  if (!message) return null;

  return (
    <Modal transparent visible={!!message} animationType="none" onRequestClose={hideAlert}>
      {/* Backdrop */}
      <Animated.View
        style={[
          backdropStyle,
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.text, zIndex: 9998 },
        ]}
      />

      {/* Alert Card */}
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 20,
            zIndex: 9999,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        {/* Message */}
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 20, textAlign: "center" }}>
          {message}
        </Text>

        {/* Buttons */}
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={handleCancel}
            style={{ flex: 1, backgroundColor: colors.border, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginRight: 6 }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            style={{ flex: 1, backgroundColor: confirmColor || colors.error, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginLeft: 6 }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: "600" }}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
});

AlertConfirm.displayName = "AlertConfirm";

export default AlertConfirm;
