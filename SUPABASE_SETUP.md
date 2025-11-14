# Настройка Supabase

## Обзор

Приложение Nomi использует Supabase в качестве основной базы данных для хранения всех пользовательских данных. Каждый пользователь имеет изолированный доступ к своим данным благодаря Row Level Security (RLS).

## Структура базы данных

### Таблицы

1. **users** - Профили пользователей
   - `id` - UUID пользователя в Supabase
   - `clerk_id` - ID пользователя из Clerk (для аутентификации)
   - `email` - Email пользователя
   - `name` - Имя пользователя
   - `currency` - Валюта по умолчанию (KZT)
   - `locale` - Локаль (ru-RU)

2. **transactions** - Транзакции пользователя
   - Расходы и доходы
   - Поддержка рекуррентных платежей
   - AI-рекомендации и теги

3. **budgets** - Бюджеты по категориям
   - Лимиты на период (неделя/месяц)
   - AI-предсказания трат
   - Автоматический подсчет использованного бюджета

4. **goals** - Финансовые цели
   - Целевая сумма и текущий прогресс
   - AI-оценка достижимости
   - Рекомендации по еженедельным накоплениям

5. **ai_insights** - AI-инсайты и рекомендации
   - Коучинг, аномалии, предсказания
   - Приоритезация по важности
   - Статус прочитано/не прочитано

6. **challenges** - Игровые челленджи
   - Различные типы: экономия, траты, категории
   - Прогресс и стрики
   - Связь с бейджами

7. **badges** - Игровые достижения
   - Иконки и описания
   - Дата получения

8. **anomaly_alerts** - Оповещения об аномалиях
   - Необычные траты
   - Дубликаты транзакций
   - Уровни серьезности

9. **user_settings** - Настройки пользователя
   - Тема, биометрия
   - Настройки уведомлений
   - Настройки приватности AI

10. **game_stats** - Игровая статистика
    - Очки, уровень
    - Стрики

## Безопасность (RLS)

Все таблицы защищены Row Level Security политиками:
- Пользователи видят только свои данные
- Доступ контролируется через `clerk_id`
- Создание, чтение, обновление и удаление - только своих записей

## Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
EXPO_PUBLIC_SUPABASE_URL=https://dnkeulxxknyuqfjxjfrd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRua2V1bHh4a255dXFmanhqZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzA2MzMsImV4cCI6MjA3ODcwNjYzM30.JSyXlv60GQ1umVCBM4_XjrKapWOImLOoZB-OFlsxL9M
```

## Использование в коде

### 1. Прямой доступ к Supabase клиенту

```typescript
import { supabase } from '@/lib/supabase';

// Пример запроса
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);
```

### 2. Использование готовых функций синхронизации

```typescript
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/supabase-sync';

// Получить транзакции
const transactions = await getTransactions(userId);

// Создать транзакцию
await createTransaction(userId, {
  amount: 1000,
  category: 'food',
  description: 'Обед',
  date: new Date(),
  type: 'expense',
});
```

### 3. Использование хуков (рекомендуется)

```typescript
import { useTransactions, useBudgets, useGoals } from '@/hooks/use-supabase';

function MyComponent() {
  const { transactions, isLoading, add, update, remove } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  // Автоматическая синхронизация и real-time обновления!
  
  return (
    // Ваш UI
  );
}
```

### 4. Real-time подписки

Все хуки автоматически подписываются на изменения в базе данных:

```typescript
// Подписка уже встроена в хуки
const { transactions } = useTransactions();

// Транзакции будут автоматически обновляться при изменениях в БД
```

## Миграции

Все миграции находятся в Supabase и применены через MCP Supabase:

- `create_users_table`
- `create_transactions_table`
- `create_budgets_table`
- `create_goals_table`
- `create_insights_table`
- `create_challenges_table`
- `create_badges_table`
- `create_anomaly_alerts_table`
- `create_user_settings_table`
- `create_game_stats_table`
- `create_rls_policies_*` - RLS политики для всех таблиц

## Типизация

Все типы базы данных находятся в `types/database.ts` и полностью совместимы с TypeScript.

## Интеграция с Clerk

Приложение использует Clerk для аутентификации. Связь между Clerk и Supabase:

1. Пользователь входит через Clerk
2. Получаем `clerk_id` из Clerk
3. Создаем/находим запись в таблице `users` по `clerk_id`
4. Используем `user_id` из Supabase для всех операций с данными

## Рекомендации

1. **Всегда используйте хуки** для работы с данными в компонентах
2. **Используйте функции из supabase-sync** для операций вне компонентов
3. **Не храните sensitive данные** в публичных полях
4. **Используйте индексы** для оптимизации сложных запросов
5. **Тестируйте RLS политики** перед продакшеном

## Troubleshooting

### Ошибка "Missing Supabase environment variables"
Убедитесь, что создали файл `.env` с правильными переменными окружения.

### Ошибка "User not authenticated"
Проверьте, что пользователь вошел через Clerk и `clerk_id` установлен.

### Данные не обновляются в real-time
Убедитесь, что подписки работают корректно. Проверьте консоль на ошибки подключения.

### RLS блокирует запросы
Убедитесь, что используете правильный `clerk_id` и политики настроены корректно.

