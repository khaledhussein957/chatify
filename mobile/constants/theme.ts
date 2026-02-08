export const DARK_COLORS = {
  background: "#000000",
  primary: "#22C55E",
  white: "#FFFFFF",
  text: "#F4F4F5",
  grey: "#9CA3AF",
  surfaceCard: "#1A1A1D",
  surfaceLight: "#2A2A2E",
  foreground: "#F4F4F5",
  error: "#EF4444",
  success: "#22C55E",
  inputBackground: "#1A1A1D",
};

export const LIGHT_COLORS = {
  background: "#FFFFFF",
  primary: "#22C55E",
  white: "#FFFFFF",
  text: "#1A1A1D",
  grey: "#6B7280",
  surfaceCard: "#F3F4F6",
  surfaceLight: "#E5E7EB",
  foreground: "#111827",
  error: "#DC2626",
  success: "#16A34A",
  inputBackground: "#F9FAFB",
};

export type ThemeColors = typeof DARK_COLORS;
export const COLORS = DARK_COLORS; // Default export for backwards compatibility during migration
