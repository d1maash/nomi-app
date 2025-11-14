import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SplashScreen from 'expo-splash-screen';
import { useStore } from '@/store';
import { CLERK_CONFIG, clerkTokenCache } from '@/lib/clerk';
import { biometricService } from '@/services/biometric';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { darkTheme } from '@/styles/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SupabaseProvider } from '@/components/supabase-provider';

// Предотвращаем автоматическое скрытие splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricChecked, setIsBiometricChecked] = useState(false);
  const loadFromStorage = useStore((state) => state.loadFromStorage);

  useEffect(() => {
    async function prepare() {
      try {
        // Загружаем данные из хранилища
        await loadFromStorage();

        // Проверяем биометрию, если включена
        const biometricEnabled = await biometricService.isBiometricLockEnabled();
        if (biometricEnabled) {
          const authenticated = await biometricService.authenticate();
          if (!authenticated) {
            // Пользователь не прошёл биометрию - показываем заглушку
            return;
          }
        }

        setIsBiometricChecked(true);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loadFromStorage]);

  if (isLoading || !isBiometricChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={darkTheme.colors.primary} />
      </View>
    );
  }

  // Проверяем наличие Clerk ключа
  const hasClerkKey = CLERK_CONFIG.publishableKey && CLERK_CONFIG.publishableKey.length > 0;

  const AppStack = () => (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Транзакция',
          headerStyle: { backgroundColor: darkTheme.colors.background },
          headerTintColor: darkTheme.colors.text,
        }}
      />
      <Stack.Screen
        name="add-transaction"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Новая транзакция',
          headerStyle: { backgroundColor: darkTheme.colors.background },
          headerTintColor: darkTheme.colors.text,
        }}
      />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {hasClerkKey ? (
        <ClerkProvider
          publishableKey={CLERK_CONFIG.publishableKey}
          tokenCache={clerkTokenCache}
        >
          <SupabaseProvider>
            <AppStack />
          </SupabaseProvider>
        </ClerkProvider>
      ) : (
        <AppStack />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
  },
});
