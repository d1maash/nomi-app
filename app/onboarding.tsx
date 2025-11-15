import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { darkTheme } from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { biometricService } from '@/services/biometric';
import { notificationService } from '@/services/notifications';
import { triggerHaptic } from '@/utils/haptics';
import { MonoIcon } from '@/components/ui/mono-icon';
import type { MonoIconName } from '@/types/icon';
import { useSettings } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';
import { useStore } from '@/store';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES: Array<{
  icon: MonoIconName;
  title: string;
  description: string;
}> = [
  {
    icon: 'pocket',
    title: 'Быстрый учёт расходов',
    description: 'Добавляй транзакции за секунды. Работает даже офлайн.',
  },
  {
    icon: 'cpu',
    title: 'AI-помощник',
    description: 'Умный анализ трат, прогнозы и персональные советы по экономии.',
  },
  {
    icon: 'target',
    title: 'Цели и челленджи',
    description: 'Ставь финансовые цели и выполняй челленджи с наградами.',
  },
  {
    icon: 'shield',
    title: 'Приватность и контроль',
    description: 'Твои данные хранятся локально. AI-функции можно отключить.',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { update: updateSettings } = useSettings();
  const { isInitialized } = useSupabase();
  const completeOnboarding = useStore((state) => state.completeOnboarding);

  const handleNext = () => {
    triggerHaptic.light();
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    triggerHaptic.success();

    // Предлагаем включить биометрию
    const biometricAvailable = await biometricService.isAvailable();
    if (biometricAvailable) {
      const biometricType = await biometricService.getBiometricType();
      // Здесь можно показать alert с предложением
      // Для простоты просто включаем
      await biometricService.setBiometricLockEnabled(true);
    }

    // Запрашиваем разрешение на уведомления
    await notificationService.requestPermissions();

    // Отмечаем онбординг как пройденный (локально и в Supabase, если доступен)
    completeOnboarding();
    if (isInitialized) {
      await updateSettings({ hasCompletedOnboarding: true });
    }

    // Переходим на экран авторизации
    router.replace('/auth');
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.slideIcon}>
          <MonoIcon name={slide.icon} size={40} color={darkTheme.colors.background} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.pagination}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Начать' : 'Далее'}
          onPress={handleNext}
          variant="primary"
          size="large"
        />
        {currentSlide < ONBOARDING_SLIDES.length - 1 && (
          <Button
            title="Пропустить"
            onPress={handleFinish}
            variant="ghost"
            style={styles.skipButton}
          />
        )}
      </View>
    </View>
  );
}

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
  slideIcon: {
    width: 120,
    height: 120,
    borderRadius: darkTheme.borderRadius.full,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.xl,
  },
  title: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  description: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkTheme.colors.surfaceLight,
    marginHorizontal: darkTheme.spacing.xs,
  },
  dotActive: {
    backgroundColor: darkTheme.colors.primary,
    width: 24,
  },
  footer: {
    gap: darkTheme.spacing.md,
  },
  skipButton: {
    marginTop: darkTheme.spacing.sm,
  },
});
