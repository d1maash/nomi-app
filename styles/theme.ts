import { APP_CONFIG } from '@/constants/app';

export const darkTheme = {
  colors: {
    background: '#050505',
    backgroundSoft: '#080808',
    surface: '#111111',
    surfaceLight: '#181818',
    surfaceElevated: '#1F1F1F',
    primary: '#F7F7F7',
    primaryLight: '#CFCFCF',
    text: '#F6F6F6',
    textSecondary: '#B3B3B3',
    textTertiary: '#7D7D7D',
    success: '#E0E0E0',
    warning: '#BDBDBD',
    error: '#8F8F8F',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.04)',
    accent: '#FFFFFF',
  },
  spacing: {
    xs: APP_CONFIG.grid / 4,
    sm: APP_CONFIG.grid / 2,
    md: APP_CONFIG.grid,
    lg: APP_CONFIG.grid * 1.5,
    xl: APP_CONFIG.grid * 2,
    xxl: APP_CONFIG.grid * 3,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 32,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: '600' as const,
      lineHeight: 42,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 20,
      fontWeight: '500' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 3,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 40,
      elevation: 12,
    },
  },
};

export const lightTheme = {
  ...darkTheme,
  colors: {
    background: '#F8F8F8',
    backgroundSoft: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceLight: '#F0F0F0',
    surfaceElevated: '#E4E4E4',
    primary: '#111111',
    primaryLight: '#2B2B2B',
    text: '#0C0C0C',
    textSecondary: '#505050',
    textTertiary: '#7A7A7A',
    success: '#3B3B3B',
    warning: '#585858',
    error: '#757575',
    border: 'rgba(12, 12, 12, 0.08)',
    cardBorder: 'rgba(12, 12, 12, 0.05)',
    accent: '#0C0C0C',
  },
};

export type Theme = typeof darkTheme;
