import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { darkTheme } from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/utils/haptics';
import { isClerkConfigured } from '@/lib/clerk';
import { MonoIcon } from '@/components/ui/mono-icon';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function AuthScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const clerkReady = isClerkConfigured();
  const [currentProvider, setCurrentProvider] = useState<'apple' | 'google' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, router]);

  const handleOAuthSignIn = useCallback(
    async (provider: 'google' | 'apple') => {
      triggerHaptic.light();

      if (isSignedIn) {
        router.replace('/(tabs)');
        return;
      }

      if (!clerkReady) {
        setErrorMessage('Clerk не настроен. Заполни ключ в .env (см. CLERK_SETUP.md).');
        return;
      }

      try {
        setCurrentProvider(provider);
        setErrorMessage(null);

        const startOAuth = provider === 'google' ? startGoogleOAuth : startAppleOAuth;
        if (!startOAuth) {
          setErrorMessage('Clerk SDK ещё загружается. Перезапусти приложение и попробуй снова.');
          return;
        }

        const { createdSessionId, setActive, signIn, signUp } = await startOAuth();
        console.log('[Clerk] OAuth result', {
          createdSessionId,
          signInId: signIn?.createdSessionId,
          signUpId: signUp?.createdSessionId,
        });

        const sessionId =
          createdSessionId || signIn?.createdSessionId || signUp?.createdSessionId;

        if (sessionId) {
          await setActive?.({ session: sessionId });
          triggerHaptic.success();
          router.replace('/(tabs)');
          return;
        }

        setErrorMessage(
          'Не удалось создать сессию. Проверь Native API и redirect URLs в настройках Clerk.'
        );
      } catch (error) {
        console.error(`[Clerk] ${provider} OAuth error`, error);
        if (isAlreadySignedInError(error)) {
          triggerHaptic.success();
          router.replace('/(tabs)');
          return;
        }
        setErrorMessage('Авторизация не удалась. См. CLERK_SETUP.md и убедись, что Native API включен.');
      } finally {
        setCurrentProvider(null);
      }
    },
    [clerkReady, startGoogleOAuth, startAppleOAuth, router, isSignedIn]
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <MonoIcon name="pocket" size={36} color={darkTheme.colors.background} />
        </View>
        <Text style={styles.title}>Nomi</Text>
        <Text style={styles.subtitle}>
          Твой умный помощник в управлении финансами
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Войти через Apple"
          onPress={() => handleOAuthSignIn('apple')}
          variant="primary"
          size="large"
          loading={currentProvider === 'apple'}
          disabled={
            currentProvider !== null && currentProvider !== 'apple'
          }
        />
        <Button
          title="Войти через Google"
          onPress={() => handleOAuthSignIn('google')}
          variant="secondary"
          size="large"
          loading={currentProvider === 'google'}
          disabled={
            currentProvider !== null && currentProvider !== 'google'
          }
        />
        {!clerkReady && (
          <>
            <Text style={styles.warning}>
              Добавь EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY в .env и перезапусти Expo (см. CLERK_SETUP.md)
            </Text>
            <Button
              title="Продолжить без входа"
              onPress={() => router.replace('/(tabs)')}
              variant="ghost"
              size="large"
            />
          </>
        )}
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        <Text style={styles.terms}>
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности
        </Text>
      </View>
    </View>
  );
}

const isAlreadySignedInError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const possibleArray = (error as { errors?: Array<{ message?: string; code?: string }> }).errors;
  if (Array.isArray(possibleArray)) {
    return possibleArray.some(
      (err) =>
        err?.code === 'session_exists' ||
        (err?.message && err.message.toLowerCase().includes("you're already signed in"))
    );
  }

  const message =
    (error as { message?: string }).message ||
    (error as { toString?: () => string }).toString?.();

  return Boolean(message && message.toLowerCase().includes("you're already signed in"));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    padding: darkTheme.spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: darkTheme.borderRadius.full,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.lg,
  },
  title: {
    ...darkTheme.typography.h1,
    fontSize: 48,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  subtitle: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    gap: darkTheme.spacing.md,
  },
  warning: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.warning,
    textAlign: 'center',
  },
  error: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.error,
    textAlign: 'center',
  },
  terms: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
    textAlign: 'center',
    marginTop: darkTheme.spacing.md,
  },
});
