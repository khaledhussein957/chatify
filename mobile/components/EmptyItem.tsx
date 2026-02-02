import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { COLORS } from "@/constants/theme";

type EmptyUIProps = {
  title: string;
  subtitle?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  iconSize?: number;
  buttonLabel?: string;
  onPressButton?: () => void;
};

/**
 * Render a centered empty-state UI with a title and optional icon, subtitle, and action button.
 *
 * Displays the required `title`. If `iconName` is provided an icon is shown above the title.
 * If `subtitle` is provided it appears beneath the title. If both `buttonLabel` and
 * `onPressButton` are provided, a pill-shaped action button is rendered that invokes `onPressButton`
 * when pressed.
 *
 * @param title - Primary text shown in the empty state
 * @param subtitle - Optional supplementary text shown below the title
 * @param iconName - Optional Ionicons name for the icon to display above the title
 * @param iconColor - Color used to render the icon
 * @param iconSize - Size of the icon in pixels
 * @param buttonLabel - Label text for the optional action button
 * @param onPressButton - Callback invoked when the action button is pressed
 * @returns The rendered empty-state React element
 */
function EmptyUI({
  title,
  subtitle,
  iconName = "chatbubbles-outline",
  iconColor = COLORS.grey,
  iconSize = 64,
  buttonLabel,
  onPressButton,
}: EmptyUIProps) {
  return (
    <View style={styles.container}>
      {iconName && <Ionicons name={iconName} size={iconSize} color={iconColor} />}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {buttonLabel && onPressButton && (
        <Pressable style={styles.button} onPress={onPressButton}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
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
    color: COLORS.foreground,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});