import { Platform } from 'react-native';

export const Theme = {
  colors: {
    background: '#F2F6F5', // Soft Mint White
    safeAreaBackground : '#000',
    surface: '#FFFFFF',    // Pure White
    surfaceContainerLow: '#f6f3f2',
    surfaceContainer: '#f0eded',
    primary: '#2BA8A2',    // Fresh Teal
    primaryDark: '#006A66',// Fresh Teal Dim
    primaryLight: '#85f5ee',
    onPrimary: '#FFFFFF',
    text: '#1C1B1B',       // High-contrast charcoal
    textSecondary: '#6B7280', // Slate grey
    border: '#E5E7EB',
    error: '#BA1A1A',
    errorBg: 'rgba(186, 26, 26, 0.1)',
    success: '#006E28',
    successBg: 'rgba(0, 110, 40, 0.1)',
    warning: '#D68A00',
    warningBg: 'rgba(214, 138, 0, 0.1)',
    glass: 'rgba(255, 255, 255, 0.8)',
  },
  
  rounded: {
    sm: 4,
    default: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  spacing: {
    base: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    gutter: 16,
    marginMobile: 20,
  },

  typography: {
    displayLg: {
      fontSize: 40,
      fontWeight: '700' as const,
      lineHeight: 48,
    },
    headlineLg: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    headlineMd: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    bodyLg: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 28,
    },
    bodyMd: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    labelMd: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    labelSm: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
  },
  
  shadows: Platform.select({
    ios: {
      shadowColor: '#006A66',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
    },
    android: {
      elevation: 3,
    },
    default: {
      boxShadow: '0px 4px 20px rgba(0, 106, 102, 0.04)',
    },
  }),
};

// --- Pre-existing template exports to maintain backward compatibility ---

export const Colors = {
  light: {
    text: Theme.colors.text,
    background: Theme.colors.background,
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
import '@/global.css';
