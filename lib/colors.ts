// Brand Color Palette
export const colors = {
  // Primary Colors
  dark: "#1f1f1f", // Dark charcoal - for dark backgrounds, text on light
  light: "#ffffff", // Pure white - for light backgrounds, text on dark
  lightGray: "#f2f2f2", // Light gray - for subtle backgrounds

  // Brand Colors
  accent: "#B9FF16", // Bright yellow-green - accent color
  green: "#6EBA5E", // Brand green - for buttons, highlights
  greenHover: "#5da34e", // Hover state for brand green

  // Interactive States
  accentHover: "#a3e612", // Hover state for accent
  darkHover: "#2a2a2a", // Hover state for dark

  // Utility Colors
  gray400: "#9ca3af", // Disabled states
  gray500: "#6b7280", // Muted text
  gray600: "#4b5563", // Secondary text
  gray700: "#374151", // Progress bar background
} as const

// Color usage helpers
export const colorUsage = {
  // Backgrounds
  backgroundPrimary: colors.light,
  backgroundDark: colors.dark,
  backgroundLight: colors.lightGray,
  backgroundAccent: colors.accent,

  // Text
  textPrimary: colors.dark,
  textOnDark: colors.light,
  textOnLight: colors.dark,
  textOnAccent: "#1a1a1a",
  textMuted: colors.gray600,
  textDisabled: colors.gray400,

  // Interactive
  buttonPrimary: colors.green,
  buttonPrimaryHover: colors.greenHover,
  buttonAccent: colors.accent,
  buttonAccentHover: colors.accentHover,
  buttonDark: colors.dark,
  buttonDarkHover: colors.darkHover,

  // Accents
  accent: colors.accent,
  accentHover: colors.accentHover,
  green: colors.green,
  greenHover: colors.greenHover,
  border: "#e5e7eb",
} as const
