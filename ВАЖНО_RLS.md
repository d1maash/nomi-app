# ⚠️ ВАЖНО: Row Level Security (RLS) временно отключен

## Текущее состояние

RLS (Row Level Security) **временно отключен** для всех таблиц, чтобы приложение могло работать без настройки JWT интеграции между Clerk и Supabase.

## Что это означает?

**В ТЕКУЩЕЙ КОНФИГУРАЦИИ:**
- ✅ Приложение работает
- ✅ Данные сохраняются в Supabase
- ⚠️ **НО:** Все пользователи теоретически могут видеть данные друг друга через прямые запросы к API

## Для продакшена нужно настроить RLS

### Вариант 1: Интеграция Clerk + Supabase через JWT (Рекомендуется)

**Шаг 1:** Создайте JWT шаблон в Clerk Dashboard

1. Откройте [Clerk Dashboard](https://dashboard.clerk.com)
2. Перейдите в ваше приложение
3. Нажмите **JWT Templates** в боковом меню
4. Нажмите **+ New Template**
5. Выберите **Supabase**
6. Введите следующие данные:
   - **Name:** `supabase`
   - **Supabase Project URL:** `https://dnkeulxxknyuqfjxjfrd.supabase.co`
   - **Supabase JWT Secret:** (получите из Supabase Dashboard → Settings → API → JWT Secret)

**Шаг 2:** Включите RLS обратно

```sql
-- В Supabase SQL Editor выполните:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
```

**Шаг 3:** Раскомментируйте код JWT в `components/supabase-provider.tsx`

Верните код получения токена:
```typescript
// Получаем токен для Supabase
const token = await getToken({ template: 'supabase' });

if (token) {
  // Устанавливаем токен в Supabase
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  } as any);
}
```

### Вариант 2: Использовать Service Role Key (только для бэкенда)

⚠️ **НЕБЕЗОПАСНО для клиентских приложений!**

Service Role Key обходит все RLS политики и не должен использоваться в клиентском коде.

Если вы хотите использовать этот вариант:
1. Создайте отдельный backend API (Next.js, Express, и т.д.)
2. Используйте Service Role Key только на сервере
3. Клиент обращается к вашему API, а не напрямую к Supabase

### Вариант 3: Упрощенные RLS политики без Clerk

Можно создать более простые RLS политики, которые проверяют данные на уровне приложения:

```sql
-- Пример для таблицы transactions
CREATE POLICY "Allow all for authenticated users"
  ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

⚠️ **Это НЕ безопасно** - любой пользователь сможет видеть все данные.

## Рекомендация

Для продакшена **обязательно используйте Вариант 1** - интеграцию Clerk + Supabase через JWT.

Это займет ~5 минут и обеспечит полную безопасность данных.

## Текущие риски

### В разработке (localhost):
✅ Относительно безопасно, если не делитесь API ключами

### В продакшене:
❌ **КРИТИЧНО ОПАСНО** - НЕОБХОДИМО включить RLS!

## Что делать сейчас?

### Для разработки:
- ✅ Продолжайте разработку
- ✅ Все работает
- ⚠️ Не публикуйте приложение в production

### Перед публикацией:
1. ✅ Настройте JWT интеграцию (Вариант 1)
2. ✅ Включите RLS обратно
3. ✅ Протестируйте, что пользователи видят только свои данные

## Ссылки

- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)

