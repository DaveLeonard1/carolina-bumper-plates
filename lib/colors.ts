// Brand Color Palette
export const colors = {
  // Primary Colors
  dark: "#1f1f1f", // Dark charcoal - for dark backgrounds, text on light
  light: "#ffffff", // Pure white - for light backgrounds, text on dark
  lightGray: "#f2f2f2", // Light gray - for subtle backgrounds

  // Brand Colors
  greenLight: "#a1ea93", // Light green - for dark backgrounds, highlights
  greenDark: "#4a7c59", // Dark green - for light backgrounds, readable text

  // Interactive States
  greenLightHover: "#8fd982", // Hover state for light green
  greenDarkHover: "#3d6b4a", // Hover state for dark green
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
  backgroundAccent: colors.greenLight,

  // Text
  textPrimary: colors.dark,
  textOnDark: colors.light,
  textOnLight: colors.greenDark,
  textOnAccent: colors.dark,
  textMuted: colors.gray600,
  textDisabled: colors.gray400,

  // Interactive
  buttonPrimary: colors.greenLight,
  buttonPrimaryHover: colors.greenLightHover,
  buttonSecondary: colors.greenDark,
  buttonSecondaryHover: colors.greenDarkHover,
  buttonDark: colors.dark,
  buttonDarkHover: colors.darkHover,

  // Accents
  accent: colors.greenLight,
  accentReadable: colors.greenDark,
  border: "#e5e7eb",
} as const
