import { APP_CONFIG } from '@/constants/app';

export const darkTheme = {
  colors: {
    background: '#04060C',
    backgroundSoft: '#070A14',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceLight: 'rgba(255, 255, 255, 0.07)',
    surfaceElevated: 'rgba(255, 255, 255, 0.1)',
    primary: '#9DAEFF',
    primaryLight: '#C8D2FF',
    text: '#F5F6FA',
    textSecondary: '#C0C6D8',
    textTertiary: '#8F94A8',
    success: '#6FE4B8',
    warning: '#FAD27F',
    error: '#FF8C8C',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
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
    background: '#F5F6FA',
    backgroundSoft: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceLight: '#F3F5FB',
    surfaceElevated: '#E8ECF7',
    primary: '#4C5EFF',
    primaryLight: '#9AA6FF',
    text: '#111116',
    textSecondary: '#4A4F63',
    textTertiary: '#7B8092',
    success: '#28C76F',
    warning: '#FFB547',
    error: '#FF6F61',
    border: 'rgba(17, 17, 22, 0.08)',
    cardBorder: 'rgba(17, 17, 22, 0.05)',
    accent: '#111116',
  },
};

export type Theme = typeof darkTheme;
