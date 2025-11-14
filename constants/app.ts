export const APP_CONFIG = {
  name: 'Nomi',
  currency: {
    default: 'KZT',
    symbol: '₸',
    locale: 'ru-RU',
  },
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  grid: 16,
  minTouchTarget: 44,
  limits: {
    transactionsPerPage: 20,
    maxDescriptionLength: 200,
  },
};

export const HAPTIC_PATTERNS = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
} as const;

