import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { biometricService } from '@/services/biometric';
import { triggerHaptic } from '@/utils/haptics';
import { useAuth } from '@clerk/clerk-expo';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useSettings } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, isLoaded } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const { isInitialized } = useSupabase();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await biometricService.getBiometricType();
      setBiometricType(type);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!isInitialized) return;
    
    if (value) {
      const authenticated = await biometricService.authenticate(
        'Подтвердите для включения защиты'
      );
      if (authenticated) {
        await biometricService.setBiometricLockEnabled(true);
        await updateSettings({ biometricLockEnabled: true });
        triggerHaptic.success();
      }
    } else {
      await biometricService.setBiometricLockEnabled(false);
      await updateSettings({ biometricLockEnabled: false });
    }
  };

  const handleNotificationToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
    if (!isInitialized) return;
    
    await updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
    triggerHaptic.light();
  };

  const handlePrivacyToggle = async (key: keyof typeof settings.privacy, value: boolean) => {
    if (!isInitialized) return;
    
    await updateSettings({
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    });
    triggerHaptic.light();
  };

  const performSignOut = async () => {
    try {
      // Проверяем, загружается ли Clerk
      if (!isLoaded) {
        Alert.alert('Подождите', 'Clerk ещё загружается. Попробуйте снова через несколько секунд.');
        return;
      }

      console.log('[Settings] Starting sign out...');
      console.log('[Settings] signOut function exists:', !!signOut);
      console.log('[Settings] isLoaded:', isLoaded);

      // Выполняем выход из Clerk
      if (signOut) {
        console.log('[Settings] Calling signOut()...');
        await signOut();
        console.log('[Settings] Sign out successful, redirecting to /auth...');
        
        // Явно перенаправляем на страницу входа после успешного выхода
        // Используем небольшую задержку, чтобы Clerk успел обновить состояние
        setTimeout(() => {
          console.log('[Settings] Executing redirect to /auth');
          router.replace('/auth');
        }, 300);
      } else {
        // Если Clerk не настроен или signOut недоступен, перенаправляем напрямую
        console.log('[Settings] signOut not available, redirecting to /auth directly');
        router.replace('/auth');
      }
    } catch (error) {
      console.error('[Settings] Sign out error:', error);
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта. Попробуйте ещё раз позже.');
      // В случае ошибки всё равно перенаправляем на страницу входа
      router.replace('/auth');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Настройки</Text>

      {/* Безопасность */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Безопасность</Text>
        {biometricAvailable && (
          <Card style={styles.settingCard}>
            <View style={styles.setting}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <MonoIcon name="shield" size={16} color={darkTheme.colors.text} />
                  <Text style={styles.settingLabel}>{biometricType}</Text>
                </View>
                <Text style={styles.settingDesc}>
                  Защита входа в приложение
                </Text>
              </View>
              <Switch
                value={settings.biometricLockEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{
                  false: darkTheme.colors.surfaceLight,
                  true: darkTheme.colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        )}
      </View>

      {/* Уведомления */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <Card style={styles.settingCard}>
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <MonoIcon name="bell" size={16} color={darkTheme.colors.text} />
                <Text style={styles.settingLabel}>Включить уведомления</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={(v) => handleNotificationToggle('enabled', v)}
              trackColor={{
                false: darkTheme.colors.surfaceLight,
                true: darkTheme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {settings.notifications.enabled && (
          <>
            <Card style={styles.settingCard}>
              <View style={styles.setting}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingTitleRow}>
                    <MonoIcon name="calendar" size={16} color={darkTheme.colors.text} />
                    <Text style={styles.settingLabel}>Ежемесячный бюджет</Text>
                  </View>
                  <Text style={styles.settingDesc}>
                    Уведомление в начале месяца
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.monthlyBudget}
                  onValueChange={(v) => handleNotificationToggle('monthlyBudget', v)}
                  trackColor={{
                    false: darkTheme.colors.surfaceLight,
                    true: darkTheme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>

            <Card style={styles.settingCard}>
              <View style={styles.setting}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingTitleRow}>
                    <MonoIcon name="target" size={16} color={darkTheme.colors.text} />
                    <Text style={styles.settingLabel}>Прогресс по целям</Text>
                  </View>
                </View>
                <Switch
                  value={settings.notifications.goalProgress}
                  onValueChange={(v) => handleNotificationToggle('goalProgress', v)}
                  trackColor={{
                    false: darkTheme.colors.surfaceLight,
                    true: darkTheme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>

            <Card style={styles.settingCard}>
              <View style={styles.setting}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingTitleRow}>
                    <MonoIcon name="award" size={16} color={darkTheme.colors.text} />
                    <Text style={styles.settingLabel}>Челленджи и инсайты</Text>
                  </View>
                </View>
                <Switch
                  value={settings.notifications.challenges && settings.notifications.insights}
                  onValueChange={(v) => {
                    handleNotificationToggle('challenges', v);
                    handleNotificationToggle('insights', v);
                  }}
                  trackColor={{
                    false: darkTheme.colors.surfaceLight,
                    true: darkTheme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>
          </>
        )}
      </View>

      {/* Приватность и AI */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Приватность и AI</Text>
        
        <Card style={styles.settingCard}>
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <MonoIcon name="tag" size={16} color={darkTheme.colors.text} />
                <Text style={styles.settingLabel}>Автокатегоризация</Text>
              </View>
              <Text style={styles.settingDesc}>
                AI определяет категорию транзакций
              </Text>
            </View>
            <Switch
              value={settings.privacy.aiCategorization}
              onValueChange={(v) => handlePrivacyToggle('aiCategorization', v)}
              trackColor={{
                false: darkTheme.colors.surfaceLight,
                true: darkTheme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <MonoIcon name="trending-up" size={16} color={darkTheme.colors.text} />
                <Text style={styles.settingLabel}>Прогнозы и коучинг</Text>
              </View>
              <Text style={styles.settingDesc}>
                AI-анализ и рекомендации
              </Text>
            </View>
            <Switch
              value={settings.privacy.aiPredictions && settings.privacy.aiCoaching}
              onValueChange={(v) => {
                handlePrivacyToggle('aiPredictions', v);
                handlePrivacyToggle('aiCoaching', v);
              }}
              trackColor={{
                false: darkTheme.colors.surfaceLight,
                true: darkTheme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      </View>

      {/* Выход */}
      <View style={styles.section}>
        <Button
          title="Выйти из аккаунта"
          onPress={handleSignOut}
          variant="secondary"
          size="large"
        />
      </View>

      <Text style={styles.version}>Nomi v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    padding: darkTheme.spacing.lg,
  },
  title: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xl,
  },
  section: {
    marginBottom: darkTheme.spacing.xl,
  },
  sectionTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.md,
  },
  settingCard: {
    marginBottom: darkTheme.spacing.sm,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: darkTheme.spacing.md,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
  },
  settingLabel: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  settingDesc: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  version: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
    textAlign: 'center',
    marginTop: darkTheme.spacing.xl,
    marginBottom: darkTheme.spacing.xxl,
  },
});
