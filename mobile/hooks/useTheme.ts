import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from "@/constants/theme";
import { useThemeStore } from "@/store/theme";

export const useTheme = () => {
  const { theme, toggleTheme } = useThemeStore();
  const colors: ThemeColors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return {
    theme,
    colors,
    toggleTheme,
    isDark: theme === "dark",
  };
};
