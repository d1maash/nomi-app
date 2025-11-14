import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { biometricService } from '@/services/biometric';
import { triggerHaptic } from '@/utils/haptics';

// Безопасный импорт Clerk
type OptionalSignOutHook = (() => { signOut?: () => Promise<void> }) | null;

let useSignOut: OptionalSignOutHook = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerkExpo = require('@clerk/clerk-expo');
  useSignOut = clerkExpo.useSignOut;
} catch {
  // Clerk не настроен
}

const fallbackSignOutHook = () => null;

export default function SettingsScreen() {
  const router = useRouter();
  const signOutHook = (useSignOut ?? fallbackSignOutHook)();
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

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
    if (value) {
      const authenticated = await biometricService.authenticate(
        'Подтвердите для включения защиты'
      );
      if (authenticated) {
        await biometricService.setBiometricLockEnabled(true);
        updateSettings({ biometricLockEnabled: true });
        triggerHaptic.success();
      }
    } else {
      await biometricService.setBiometricLockEnabled(false);
      updateSettings({ biometricLockEnabled: false });
    }
  };

  const handleNotificationToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
    triggerHaptic.light();
  };

  const handlePrivacyToggle = (key: keyof typeof settings.privacy, value: boolean) => {
    updateSettings({
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    });
    triggerHaptic.light();
  };

  const handleSignOut = async () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          if (signOutHook?.signOut) {
            await signOutHook.signOut();
          }
          router.replace('/auth');
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
                <Text style={styles.settingLabel}>🔒 {biometricType}</Text>
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
              <Text style={styles.settingLabel}>Включить уведомления</Text>
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
                  <Text style={styles.settingLabel}>Ежемесячный бюджет</Text>
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
                  <Text style={styles.settingLabel}>Прогресс по целям</Text>
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
                  <Text style={styles.settingLabel}>Челленджи и инсайты</Text>
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
              <Text style={styles.settingLabel}>Автокатегоризация</Text>
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
              <Text style={styles.settingLabel}>Прогнозы и коучинг</Text>
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
