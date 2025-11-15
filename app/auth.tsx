import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { darkTheme } from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/utils/haptics';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useAuthWithUsername } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    signInWithUsernameOrEmail,
    signUpWithEmail,
    signInWithGoogle,
  } = useAuthWithUsername();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);

  // Форма входа
  const [signInForm, setSignInForm] = useState({
    usernameOrEmail: '',
    password: '',
  });

  // Форма регистрации
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading, router]);

  // Вход
  const handleSignIn = async () => {
    if (!signInForm.usernameOrEmail || !signInForm.password) {
      Alert.alert('Ошибка', 'Заполни все поля');
      return;
    }

    try {
      setLoading(true);
      triggerHaptic.light();

      const { error } = await signInWithUsernameOrEmail(
        signInForm.usernameOrEmail.trim(),
        signInForm.password
      );

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Ошибка', 'Неверный email/никнейм или пароль');
        } else if (error.message.includes('не найден')) {
          Alert.alert('Ошибка', error.message);
        } else {
          Alert.alert('Ошибка', 'Не удалось войти. Проверь данные и попробуй снова.');
        }
        return;
      }

      triggerHaptic.success();
    } catch (err) {
      console.error('Sign in error:', err);
      Alert.alert('Ошибка', 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  // Регистрация
  const handleSignUp = async () => {
    const { email, password, confirmPassword, username, firstName, lastName } = signUpForm;

    if (!email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполни обязательные поля (email, пароль)');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      setLoading(true);
      triggerHaptic.light();

      const { error } = await signUpWithEmail(email.trim(), password, {
        username: username.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('already registered')) {
          Alert.alert('Ошибка', 'Этот email уже зарегистрирован');
        } else if (error.message.includes('Password should be at least')) {
          Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
        } else {
          Alert.alert('Ошибка', 'Не удалось создать аккаунт. Попробуй снова.');
        }
        return;
      }

      triggerHaptic.success();
      Alert.alert(
        'Успешно!',
        'Аккаунт создан! Проверь почту для подтверждения email.',
        [{ text: 'ОК', onPress: () => setMode('signin') }]
      );

      // Очищаем форму
      setSignUpForm({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        firstName: '',
        lastName: '',
      });
    } catch (err) {
      console.error('Sign up error:', err);
      Alert.alert('Ошибка', 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  // Вход через Google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      triggerHaptic.light();

      const { error } = await signInWithGoogle();

      if (error) {
        console.error('Google sign in error:', error);
        Alert.alert('Ошибка', 'Не удалось войти через Google');
        return;
      }

      triggerHaptic.success();
    } catch (err) {
      console.error('Google sign in error:', err);
      Alert.alert('Ошибка', 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <MonoIcon name="pocket" size={36} color={darkTheme.colors.background} />
          </View>
          <Text style={styles.title}>Nomi</Text>
          <Text style={styles.subtitle}>Твой умный помощник в управлении финансами</Text>
        </View>

        {/* Переключатель режима */}
        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeSwitchButton, mode === 'signin' && styles.modeSwitchButtonActive]}
            onPress={() => {
              setMode('signin');
              triggerHaptic.light();
            }}
          >
            <Text
              style={[
                styles.modeSwitchText,
                mode === 'signin' && styles.modeSwitchTextActive,
              ]}
            >
              Вход
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeSwitchButton, mode === 'signup' && styles.modeSwitchButtonActive]}
            onPress={() => {
              setMode('signup');
              triggerHaptic.light();
            }}
          >
            <Text
              style={[
                styles.modeSwitchText,
                mode === 'signup' && styles.modeSwitchTextActive,
              ]}
            >
              Регистрация
            </Text>
          </Pressable>
        </View>

        {/* Форма входа */}
        {mode === 'signin' && (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email или никнейм</Text>
              <TextInput
                value={signInForm.usernameOrEmail}
                onChangeText={(text) =>
                  setSignInForm((prev) => ({ ...prev, usernameOrEmail: text }))
                }
                placeholder="Введи email или никнейм"
                placeholderTextColor={darkTheme.colors.textTertiary}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Пароль</Text>
              <TextInput
                value={signInForm.password}
                onChangeText={(text) => setSignInForm((prev) => ({ ...prev, password: text }))}
                placeholder="Введи пароль"
                placeholderTextColor={darkTheme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                style={styles.input}
              />
            </View>

            <Button
              title="Войти"
              onPress={handleSignIn}
              loading={loading}
              disabled={!supabaseConfigured || loading}
              size="large"
              style={styles.submitButton}
            />
          </View>
        )}

        {/* Форма регистрации */}
        {mode === 'signup' && (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput
                value={signUpForm.email}
                onChangeText={(text) => setSignUpForm((prev) => ({ ...prev, email: text }))}
                placeholder="example@mail.com"
                placeholderTextColor={darkTheme.colors.textTertiary}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Никнейм (опционально)</Text>
              <TextInput
                value={signUpForm.username}
                onChangeText={(text) => setSignUpForm((prev) => ({ ...prev, username: text }))}
                placeholder="username"
                placeholderTextColor={darkTheme.colors.textTertiary}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.halfWidth]}>
                <Text style={styles.fieldLabel}>Имя</Text>
                <TextInput
                  value={signUpForm.firstName}
                  onChangeText={(text) =>
                    setSignUpForm((prev) => ({ ...prev, firstName: text }))
                  }
                  placeholder="Айгерим"
                  placeholderTextColor={darkTheme.colors.textTertiary}
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, styles.halfWidth]}>
                <Text style={styles.fieldLabel}>Фамилия</Text>
                <TextInput
                  value={signUpForm.lastName}
                  onChangeText={(text) => setSignUpForm((prev) => ({ ...prev, lastName: text }))}
                  placeholder="Нурланова"
                  placeholderTextColor={darkTheme.colors.textTertiary}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Пароль *</Text>
              <TextInput
                value={signUpForm.password}
                onChangeText={(text) => setSignUpForm((prev) => ({ ...prev, password: text }))}
                placeholder="Не менее 6 символов"
                placeholderTextColor={darkTheme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Подтверди пароль *</Text>
              <TextInput
                value={signUpForm.confirmPassword}
                onChangeText={(text) =>
                  setSignUpForm((prev) => ({ ...prev, confirmPassword: text }))
                }
                placeholder="Введи пароль еще раз"
                placeholderTextColor={darkTheme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                style={styles.input}
              />
            </View>

            <Button
              title="Создать аккаунт"
              onPress={handleSignUp}
              loading={loading}
              disabled={!supabaseConfigured || loading}
              size="large"
              style={styles.submitButton}
            />
          </View>
        )}

        {/* Разделитель */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Вход через Google */}
        <Button
          title="Войти через Google"
          onPress={handleGoogleSignIn}
          variant="secondary"
          size="large"
          loading={loading}
          disabled={!supabaseConfigured || loading}
        />

        {!supabaseConfigured && (
          <>
            <Text style={styles.warning}>
              Добавь EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в .env
            </Text>
            <Button
              title="Продолжить без входа"
              onPress={() => router.replace('/(tabs)')}
              variant="ghost"
              size="large"
            />
          </>
        )}

        <Text style={styles.terms}>
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: darkTheme.spacing.xl,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xl,
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
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: darkTheme.colors.surface,
    borderRadius: darkTheme.borderRadius.lg,
    padding: 4,
    marginBottom: darkTheme.spacing.xl,
  },
  modeSwitchButton: {
    flex: 1,
    paddingVertical: darkTheme.spacing.sm,
    alignItems: 'center',
    borderRadius: darkTheme.borderRadius.md,
  },
  modeSwitchButtonActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  modeSwitchText: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    fontWeight: '500',
  },
  modeSwitchTextActive: {
    color: darkTheme.colors.background,
  },
  form: {
    gap: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: darkTheme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  fieldGroup: {
    gap: darkTheme.spacing.xs,
  },
  fieldLabel: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    ...darkTheme.typography.body,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    borderRadius: darkTheme.borderRadius.lg,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
    backgroundColor: darkTheme.colors.surface,
    color: darkTheme.colors.text,
  },
  submitButton: {
    marginTop: darkTheme.spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: darkTheme.spacing.lg,
    gap: darkTheme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: darkTheme.colors.cardBorder,
  },
  dividerText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textTertiary,
  },
  warning: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.warning,
    textAlign: 'center',
    marginTop: darkTheme.spacing.lg,
  },
  terms: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
    textAlign: 'center',
    marginTop: darkTheme.spacing.xl,
  },
});
