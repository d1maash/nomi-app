import { TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Конфигурация Clerk для авторизации
 * 
 * Для работы необходимо:
 * 1. Создать аккаунт на https://clerk.com
 * 2. Создать приложение
 * 3. Получить Publishable Key
 * 4. Добавить в .env файл: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
 * 5. Настроить OAuth провайдеры (Apple, Google) в дашборде Clerk
 */

export const CLERK_CONFIG = {
  // Ключ будет браться из env переменной
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
};

// Проверка конфигурации
export const isClerkConfigured = (): boolean => {
  return Boolean(CLERK_CONFIG.publishableKey);
};

const inMemoryTokenCache: Record<string, string> = {};

// Используем SecureStore на мобильных платформах, иначе fallback в память
export const clerkTokenCache: TokenCache = {
  getToken: async (key: string) => {
    if (Platform.OS === 'web') {
      return inMemoryTokenCache[key] ?? null;
    }
    return (await SecureStore.getItemAsync(key)) ?? null;
  },
  saveToken: async (key: string, value: string | null) => {
    if (Platform.OS === 'web') {
      if (value) {
        inMemoryTokenCache[key] = value;
      } else {
        delete inMemoryTokenCache[key];
      }
      return;
    }

    if (!value) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
};
