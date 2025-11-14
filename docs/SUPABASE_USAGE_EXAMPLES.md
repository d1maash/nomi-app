# Примеры использования Supabase в приложении

## Содержание

1. [Базовая настройка](#базовая-настройка)
2. [Работа с транзакциями](#работа-с-транзакциями)
3. [Работа с бюджетами](#работа-с-бюджетами)
4. [Работа с целями](#работа-с-целями)
5. [AI Инсайты](#ai-инсайты)
6. [Real-time обновления](#real-time-обновления)
7. [Синхронизация данных](#синхронизация-данных)

## Базовая настройка

### 1. Создайте файл `.env` в корне проекта

```env
EXPO_PUBLIC_SUPABASE_URL=https://dnkeulxxknyuqfjxjfrd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. SupabaseProvider уже встроен в `_layout.tsx`

```typescript
// app/_layout.tsx
<ClerkProvider>
  <SupabaseProvider>
    <AppStack />
  </SupabaseProvider>
</ClerkProvider>
```

## Работа с транзакциями

### Вариант 1: Использование хука useTransactions

```typescript
import { useTransactions } from '@/hooks/use-supabase';

function TransactionsScreen() {
  const { 
    transactions, 
    isLoading, 
    add, 
    update, 
    remove,
    refresh 
  } = useTransactions();

  // Добавление транзакции
  async function handleAddTransaction() {
    await add({
      amount: 1500,
      category: 'food',
      description: 'Обед в кафе',
      date: new Date(),
      type: 'expense',
      tags: ['ресторан'],
    });
  }

  // Обновление транзакции
  async function handleUpdateTransaction(id: string) {
    await update(id, {
      amount: 2000,
      description: 'Обед в кафе (обновлено)',
    });
  }

  // Удаление транзакции
  async function handleDeleteTransaction(id: string) {
    await remove(id);
  }

  // Ручное обновление
  async function handleRefresh() {
    await refresh();
  }

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      <FlatList
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item}
            onDelete={() => handleDeleteTransaction(item.id)}
            onEdit={() => handleUpdateTransaction(item.id)}
          />
        )}
      />
      <Button title="Добавить транзакцию" onPress={handleAddTransaction} />
      <Button title="Обновить" onPress={handleRefresh} />
    </View>
  );
}
```

### Вариант 2: Прямое использование функций

```typescript
import { 
  getTransactions, 
  createTransaction,
  updateTransaction,
  deleteTransaction 
} from '@/services/supabase-sync';
import { useSupabase } from '@/components/supabase-provider';

function MyComponent() {
  const { userId } = useSupabase();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId]);

  async function loadTransactions() {
    const data = await getTransactions(userId!);
    setTransactions(data);
  }

  async function addTransaction() {
    await createTransaction(userId!, {
      amount: 1500,
      category: 'food',
      description: 'Обед',
      date: new Date(),
      type: 'expense',
    });
    await loadTransactions(); // Обновляем список
  }

  return (
    // UI
  );
}
```

## Работа с бюджетами

```typescript
import { useBudgets } from '@/hooks/use-supabase';

function BudgetsScreen() {
  const { budgets, isLoading, add, update, remove } = useBudgets();

  async function createBudget() {
    await add({
      category: 'food',
      limit: 50000, // 50,000 KZT
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
      aiPrediction: {
        predictedSpend: 45000,
        confidence: 0.85,
        recommendation: 'Вы на правильном пути!',
      },
    });
  }

  async function updateBudgetSpent(id: string, spent: number) {
    await update(id, { spent });
  }

  return (
    <View>
      {budgets.map((budget) => (
        <BudgetCard 
          key={budget.id}
          budget={budget}
          onUpdate={(spent) => updateBudgetSpent(budget.id, spent)}
          onDelete={() => remove(budget.id)}
        />
      ))}
      <Button title="Создать бюджет" onPress={createBudget} />
    </View>
  );
}
```

## Работа с целями

```typescript
import { useGoals } from '@/hooks/use-supabase';

function GoalsScreen() {
  const { goals, isLoading, add, update, remove } = useGoals();

  async function createGoal() {
    await add({
      name: 'Отпуск в Турции',
      targetAmount: 500000, // 500,000 KZT
      currentAmount: 0,
      deadline: new Date('2025-07-01'),
      category: 'travel',
      aiETA: {
        estimatedDate: new Date('2025-06-15'),
        recommendedWeeklySaving: 15000,
        riskLevel: 'low',
        note: 'При текущих темпах вы достигнете цели раньше срока!',
      },
    });
  }

  async function updateProgress(id: string, amount: number) {
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      await update(id, {
        currentAmount: goal.currentAmount + amount,
      });
    }
  }

  return (
    <View>
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onAddProgress={(amount) => updateProgress(goal.id, amount)}
          onDelete={() => remove(goal.id)}
        />
      ))}
      <Button title="Создать цель" onPress={createGoal} />
    </View>
  );
}
```

## AI Инсайты

```typescript
import { useInsights } from '@/hooks/use-supabase';

function InsightsScreen() {
  const { insights, isLoading, add, markAsRead } = useInsights();

  // Создание нового инсайта (обычно делается автоматически AI сервисом)
  async function createInsight() {
    await add({
      type: 'coaching',
      title: '🎯 Отличная неделя!',
      message: 'Вы сэкономили на 15% больше, чем обычно',
      actionable: 'Продолжайте в том же духе и достигните цели раньше',
      priority: 'medium',
      category: 'food',
      date: new Date(),
      read: false,
    });
  }

  async function handleMarkAsRead(id: string) {
    await markAsRead(id);
  }

  // Фильтр непрочитанных
  const unreadInsights = insights.filter((i) => !i.read);

  return (
    <View>
      <Text>Непрочитанных: {unreadInsights.length}</Text>
      {insights.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onPress={() => handleMarkAsRead(insight.id)}
        />
      ))}
    </View>
  );
}
```

## Real-time обновления

Все хуки автоматически подписываются на изменения в базе данных:

```typescript
function TransactionsScreen() {
  // Подписка на real-time обновления происходит автоматически
  const { transactions, isLoading } = useTransactions();

  // transactions будут обновляться автоматически при:
  // - Добавлении новой транзакции
  // - Изменении существующей
  // - Удалении транзакции
  // Даже если изменения произошли на другом устройстве!

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => <TransactionItem transaction={item} />}
    />
  );
}
```

## Синхронизация данных

### Использование SupabaseProvider

```typescript
import { useSupabase } from '@/components/supabase-provider';

function SettingsScreen() {
  const { 
    isInitialized, 
    isSyncing, 
    lastSyncTime, 
    syncData 
  } = useSupabase();

  async function handleManualSync() {
    await syncData();
  }

  return (
    <View>
      <Text>Инициализирован: {isInitialized ? 'Да' : 'Нет'}</Text>
      <Text>Синхронизация: {isSyncing ? 'В процессе...' : 'Завершена'}</Text>
      <Text>
        Последняя синхронизация: 
        {lastSyncTime ? lastSyncTime.toLocaleString('ru-RU') : 'Никогда'}
      </Text>
      <Button 
        title="Синхронизировать вручную" 
        onPress={handleManualSync}
        disabled={isSyncing}
      />
    </View>
  );
}
```

### Универсальная синхронизация всех данных

```typescript
import { useSupabaseSync } from '@/hooks/use-supabase';

function App() {
  const { sync, isSyncing, lastSyncTime } = useSupabaseSync();

  useEffect(() => {
    // Синхронизация при запуске
    sync();

    // Периодическая синхронизация каждые 5 минут
    const interval = setInterval(() => {
      sync();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    // UI
  );
}
```

## Обработка ошибок

```typescript
function TransactionsScreen() {
  const { transactions, add } = useTransactions();
  const [error, setError] = useState<string | null>(null);

  async function handleAddTransaction() {
    try {
      setError(null);
      await add({
        amount: 1500,
        category: 'food',
        description: 'Обед',
        date: new Date(),
        type: 'expense',
      });
    } catch (err) {
      setError('Не удалось добавить транзакцию');
      console.error(err);
    }
  }

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Добавить" onPress={handleAddTransaction} />
    </View>
  );
}
```

## Работа с настройками пользователя

```typescript
import { getUserSettings, updateUserSettings } from '@/services/supabase-sync';
import { useSupabase } from '@/components/supabase-provider';

function SettingsScreen() {
  const { userId } = useSupabase();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  async function loadSettings() {
    const data = await getUserSettings(userId!);
    setSettings(data);
  }

  async function updateTheme(theme: 'dark' | 'light') {
    await updateUserSettings(userId!, { theme });
    await loadSettings();
  }

  async function toggleNotifications() {
    if (!settings) return;
    
    await updateUserSettings(userId!, {
      notifications: {
        ...settings.notifications,
        enabled: !settings.notifications.enabled,
      },
    });
    await loadSettings();
  }

  return (
    <View>
      <Button title="Темная тема" onPress={() => updateTheme('dark')} />
      <Button title="Светлая тема" onPress={() => updateTheme('light')} />
      <Button 
        title={`Уведомления: ${settings?.notifications.enabled ? 'Вкл' : 'Выкл'}`}
        onPress={toggleNotifications}
      />
    </View>
  );
}
```

## Оптимизация и Best Practices

### 1. Используйте мемоизацию для избежания лишних рендеров

```typescript
const transactions = useMemo(() => {
  return allTransactions.filter(t => t.type === 'expense');
}, [allTransactions]);
```

### 2. Кэшируйте данные локально

```typescript
// SupabaseProvider автоматически синхронизирует с store
const transactions = useStore(state => state.transactions);
```

### 3. Используйте оптимистичные обновления

```typescript
async function deleteTransaction(id: string) {
  // Сразу удаляем из UI
  setTransactions(prev => prev.filter(t => t.id !== id));
  
  try {
    // Затем удаляем из БД
    await remove(id);
  } catch (error) {
    // Если ошибка - возвращаем обратно
    await refresh();
  }
}
```

### 4. Обрабатывайте offline режим

```typescript
import NetInfo from '@react-native-community/netinfo';

function useOfflineSync() {
  const { sync } = useSupabaseSync();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Синхронизация при восстановлении соединения
        sync();
      }
    });

    return () => unsubscribe();
  }, []);
}
```

## Troubleshooting

### Проблема: Данные не синхронизируются

**Решение:** Проверьте, что:
1. `.env` файл создан с правильными переменными
2. Пользователь авторизован через Clerk
3. SupabaseProvider обернут вокруг приложения
4. Нет ошибок в консоли

### Проблема: Real-time не работает

**Решение:** Убедитесь, что:
1. Подписки корректно настроены в хуках
2. Supabase Realtime включен в проекте
3. RLS политики не блокируют доступ

### Проблема: Медленные запросы

**Решение:**
1. Добавьте индексы для часто используемых полей
2. Используйте пагинацию для больших списков
3. Кэшируйте данные локально

