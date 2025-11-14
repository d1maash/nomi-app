import { Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useStore } from '@/store';
import { darkTheme } from '@/styles/theme';

export default function TabsLayout() {
  const user = useUser();
  const { isSignedIn: authIsSignedIn, isLoaded: authIsLoaded } = useAuth();
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);

  // Проверяем, настроен ли Clerk
  const clerkConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
  
  // Clerk может быть не настроен - проверяем
  const isLoaded = user?.isLoaded ?? authIsLoaded ?? true;
  
  // Используем useAuth для более надежной проверки состояния входа
  // Если Clerk настроен, используем его состояние, иначе разрешаем доступ
  const isSignedIn = clerkConfigured 
    ? (authIsSignedIn ?? user?.isSignedIn ?? false) 
    : true;

  console.log('[TabsLayout] State:', {
    isLoaded,
    isSignedIn,
    authIsSignedIn,
    userIsSignedIn: user?.isSignedIn,
    clerkConfigured,
    onboardingCompleted
  });

  // Перенаправляем на онбординг, если не пройден
  if (isLoaded && !onboardingCompleted) {
    console.log('[TabsLayout] Onboarding not completed, redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  // Перенаправляем на авторизацию, если не залогинен (только если Clerk настроен)
  if (isLoaded && !isSignedIn && clerkConfigured) {
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
  const icons: Record<string, string> = {
    home: '🏠',
    list: '📋',
    chart: '📊',
    bulb: '💡',
    settings: '⚙️',
  };

  return (
    <Text
      style={{
        fontSize: 24,
        color,
        opacity: color === darkTheme.colors.textSecondary ? 0.6 : 1,
      }}
    >
      {icons[name] || '•'}
    </Text>
  );
}
