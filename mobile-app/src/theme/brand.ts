/**
 * Brand Colors - Hobbiz Mobile App
 * Matching web application color scheme
 */

export const BrandColors = {
  // Primary brand color (blue)
  primary: '#355070',
  primaryHover: '#2d4358',
  primaryLight: 'rgba(53, 80, 112, 0.1)',
  primaryContrast: '#ffffff',

  // Secondary colors
  secondary: '#6c757d',
  secondaryHover: '#5a6268',
  secondaryLight: 'rgba(108, 117, 125, 0.1)',

  // Accent color (coral/salmon)
  accent: '#F8B195',
  accentHover: '#fcc2a6',
  accentLight: 'rgba(248, 177, 149, 0.1)',

  // Danger/Error
  danger: '#dc3545',
  dangerHover: '#c82333',
  dangerLight: 'rgba(220, 53, 69, 0.1)',

  // Success
  success: '#28a745',
  successHover: '#218838',
  successLight: 'rgba(40, 167, 69, 0.1)',

  // Warning
  warning: '#ffc107',
  warningHover: '#e0a800',
  warningLight: 'rgba(255, 193, 7, 0.1)',

  // Info
  info: '#17a2b8',
  infoHover: '#138496',
  infoLight: 'rgba(23, 162, 184, 0.1)',

  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  text: '#2c3e50',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  border: '#dee2e6',
  borderLight: '#e9ecef',
  background: '#f8f9fa',
  surface: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Dark mode variants
  dark: {
    primary: '#4a6b8a',
    background: '#151718',
    surface: '#1e2124',
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    border: '#2e3338',
  },
};

/**
 * Typography scale matching web app
 */
export const Typography = {
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Spacing scale (consistent with web)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

/**
 * Border radius scale
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
};

/**
 * Shadow presets (iOS/Android compatible)
 */
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Common component styles
 */
export const CommonStyles = {
  // Card style
  card: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },

  // Button primary
  buttonPrimary: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Button outline
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: BrandColors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Input
  input: {
    backgroundColor: BrandColors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: BrandColors.text,
  },
};

export default {
  BrandColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CommonStyles,
};
