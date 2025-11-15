import { Tabs, Redirect } from 'expo-router';
import { darkTheme } from '@/styles/theme';
import { MonoIcon } from '@/components/ui/mono-icon';
import type { MonoIconName } from '@/types/icon';
import { useSettings } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useStore } from '@/store';

export default function TabsLayout() {
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSettings();
  const localOnboardingCompleted = useStore((state) => state.onboardingCompleted);
  const onboardingCompleted = supabaseConfigured
    ? (settings?.hasCompletedOnboarding ?? localOnboardingCompleted)
    : localOnboardingCompleted;
  const supabaseConfigured = isSupabaseConfigured();

  // Состояние загрузки
  const isLoaded = !authLoading;
  
  // Пользователь залогинен, если есть user
  const isSignedIn = Boolean(user);

  console.log('[TabsLayout] State:', {
    isLoaded,
    isSignedIn,
    userId: user?.id,
    supabaseConfigured,
    onboardingCompleted
  });

  // Перенаправляем на онбординг, если не пройден
  if (isLoaded && !onboardingCompleted) {
    console.log('[TabsLayout] Onboarding not completed, redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  // Перенаправляем на авторизацию, если не залогинен (только если Supabase настроен)
  if (isLoaded && !isSignedIn && supabaseConfigured) {
    console.log('[TabsLayout] User not signed in, redirecting to /auth');
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: darkTheme.colors.primary,
        tabBarInactiveTintColor: darkTheme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: darkTheme.colors.backgroundSoft,
          borderTopColor: darkTheme.colors.cardBorder,
          height: 90,
          paddingBottom: 30,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: darkTheme.colors.background,
        },
        headerTintColor: darkTheme.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Транзакции',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Бюджеты',
          tabBarIcon: ({ color }) => <TabIcon name="chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Инсайты',
          tabBarIcon: ({ color }) => <TabIcon name="bulb" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Простые иконки на основе emoji
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, MonoIconName> = {
    home: 'home',
    list: 'list',
    chart: 'bar-chart-2',
    bulb: 'sun',
    settings: 'sliders',
  };

  return (
    <MonoIcon
      name={icons[name] ?? 'circle'}
      color={color}
      size={22}
      style={{ opacity: color === darkTheme.colors.textSecondary ? 0.6 : 1 }}
    />
  );
}
