import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Абстракция хранилища для совместимости с Expo Go
 * В Production можно заменить на MMKV для лучшей производительности
 * 
 * Для перехода на MMKV:
 * 1. Создать Development Build: npx expo prebuild
 * 2. Заменить AsyncStorage на react-native-mmkv
 * 3. API остаётся тем же
 */

export const storageKeys = {
  USER: 'user',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  INSIGHTS: 'insights',
  CHALLENGES: 'challenges',
  BADGES: 'badges',
  SETTINGS: 'settings',
  GAME_STATS: 'gameStats',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  LAST_SYNC: 'lastSync',
  CATEGORY_CORRECTIONS: 'categoryCorrections',
} as const;

// Утилиты для работы с хранилищем
export const storageUtils = {
  set: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  delete: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
  has: async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  },
};
