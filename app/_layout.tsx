import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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

  useEffect(() => {
    async function prepare() {
      try {
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
  }, []);

  if (isLoading || !isBiometricChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={darkTheme.colors.primary} />
      </View>
    );
  }

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
        name="auth/callback" 
        options={{
          headerShown: false,
        }}
      />
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
      <SupabaseProvider>
        <AppStack />
      </SupabaseProvider>
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
