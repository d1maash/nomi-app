import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { darkTheme } from '@/styles/theme';
import * as Linking from 'expo-linking';
import { extractOAuthTokensFromParams, extractOAuthTokensFromUrl } from '@/utils/oauth';

/**
 * Страница для обработки OAuth callback
 * Вызывается после успешной авторизации через Google
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('[AuthCallback] Params received:', params);

        let activeSession = null;
        let tokens = extractOAuthTokensFromParams(params);

        if (!tokens) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            console.log('[AuthCallback] Initial URL:', initialUrl);
            tokens = extractOAuthTokensFromUrl(initialUrl);
          }
        }

        if (tokens) {
          console.log('[AuthCallback] Tokens found, setting session');
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });

          if (setSessionError) {
            console.error('[AuthCallback] Set session error:', setSessionError);
            router.replace('/auth');
            return;
          }

          activeSession = data.session;
        }

        if (!activeSession) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('[AuthCallback] Session error:', sessionError);
            router.replace('/auth');
            return;
          }

          activeSession = session;
        }

        if (activeSession) {
          console.log('[AuthCallback] Session found, user authenticated:', activeSession.user.email);

          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', activeSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('[AuthCallback] Profile error:', profileError);
          }

          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        } else {
          console.log('[AuthCallback] No session found after processing tokens');
          setTimeout(() => {
            router.replace('/auth');
          }, 1000);
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setTimeout(() => {
          router.replace('/auth');
        }, 1000);
      }
    }

    const timer = setTimeout(() => {
      handleCallback();
    }, 500);

    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={darkTheme.colors.accent} />
      <Text style={styles.text}>Обработка авторизации...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background,
    gap: darkTheme.spacing.md,
  },
  text: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
});
