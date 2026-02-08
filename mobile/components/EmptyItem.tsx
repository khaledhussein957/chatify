import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type EmptyUIProps = {
  title: string;
  subtitle?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  iconSize?: number;
  buttonLabel?: string;
  onPressButton?: () => void;
};

function EmptyUI({
  title,
  subtitle,
  iconName = "chatbubbles-outline",
  iconColor,
  iconSize = 64,
  buttonLabel,
  onPressButton,
}: EmptyUIProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={iconColor || colors.grey}
        />
      )}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.grey }]}>
          {subtitle}
        </Text>
      )}

      {buttonLabel && onPressButton && (
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onPressButton}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            {buttonLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default EmptyUI;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  title: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
