# Настройка Supabase Authentication

## ✅ Что уже сделано

Система аутентификации полностью переписана с Clerk на Supabase Auth:

1. ✅ Создана миграция базы данных (таблица `users` обновлена для работы с Supabase Auth)
2. ✅ Реализована регистрация через email/password с дополнительными полями (имя, фамилия, никнейм)
3. ✅ Реализован вход через email/никнейм + пароль
4. ✅ Добавлена кнопка входа через Google OAuth
5. ✅ Созданы хуки `useAuth` и `useAuthWithUsername` для работы с аутентификацией
6. ✅ Обновлены все компоненты для работы с новой системой
7. ✅ RLS (Row Level Security) настроен для всех таблиц

## 📋 Что нужно настроить в Supabase Dashboard

### 1. Настройка Google OAuth

#### Шаг 1: Создай проект в Google Cloud Console

1. Зайди на [Google Cloud Console](https://console.cloud.google.com/)
2. Создай новый проект или выбери существующий
3. Перейди в **APIs & Services** → **OAuth consent screen**
4. Выбери **External** и нажми **Create**
5. Заполни обязательные поля:
   - App name: `Nomi App`
   - User support email: твой email
   - Developer contact email: твой email
6. Сохрани и продолжи

#### Шаг 2: Создай OAuth 2.0 Client ID

1. Перейди в **APIs & Services** → **Credentials**
2. Нажми **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Выбери **Application type**: **Web application**
4. Добавь в **Authorized redirect URIs**:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   (Замени `[YOUR_PROJECT_REF]` на свой project ref из Supabase Dashboard)

5. Скопируй **Client ID** и **Client Secret**

#### Шаг 3: Настрой Google Provider в Supabase

1. Зайди в [Supabase Dashboard](https://app.supabase.com/)
2. Выбери свой проект
3. Перейди в **Authentication** → **Providers**
4. Найди **Google** и включи его
5. Вставь **Client ID** и **Client Secret** из Google Cloud Console
6. Сохрани изменения

### 2. Настройка Deep Linking для OAuth (для мобильного приложения)

#### Для iOS:

Добавь в `app.json`:

```json
{
  "expo": {
    "scheme": "nomiapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.nomiapp"
    }
  }
}
```

#### Для Android:

```json
{
  "expo": {
    "scheme": "nomiapp",
    "android": {
      "package": "com.yourcompany.nomiapp"
    }
  }
}
```

#### Обнови Google OAuth Redirect URI:

Добавь в Google Cloud Console дополнительный Authorized redirect URI:
```
nomiapp://auth/callback
```

### 3. Настройка Email Подтверждения (опционально)

1. В Supabase Dashboard перейди в **Authentication** → **Email Templates**
2. Настрой шаблоны писем для:
   - Confirm signup (подтверждение регистрации)
   - Magic Link (вход по ссылке)
   - Change Email Address
   - Reset Password

### 4. Настройка URL Redirect (для production)

В Supabase Dashboard → **Authentication** → **URL Configuration** добавь:

**Site URL**:
```
https://your-production-domain.com
```

**Redirect URLs**:
```
https://your-production-domain.com/auth/callback
nomiapp://auth/callback
exp://localhost:8081
```

## 🚀 Как использовать новую систему

### Регистрация пользователя

```typescript
import { useAuth } from '@/hooks/use-auth';

const { signUpWithEmail } = useAuth();

await signUpWithEmail('user@example.com', 'password123', {
  username: 'username',
  firstName: 'Айгерим',
  lastName: 'Нурланова'
});
```

### Вход через email/password

```typescript
const { signInWithEmail } = useAuth();

await signInWithEmail('user@example.com', 'password123');
```

### Вход через username/password

```typescript
import { useAuthWithUsername } from '@/hooks/use-auth';

const { signInWithUsernameOrEmail } = useAuthWithUsername();

await signInWithUsernameOrEmail('username', 'password123');
```

### Вход через Google

```typescript
const { signInWithGoogle } = useAuth();

await signInWithGoogle();
```

### Выход

```typescript
const { signOut } = useAuth();

await signOut();
```

### Обновление профиля

```typescript
const { updateProfile } = useAuth();

await updateProfile({
  first_name: 'Новое Имя',
  last_name: 'Новая Фамилия',
  username: 'new_username'
});
```

## 🔧 Переменные окружения

Убедись, что в `.env` есть:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Тестирование

1. **Регистрация через email**: Проверь, что после регистрации приходит письмо с подтверждением
2. **Вход через email**: Проверь вход с подтвержденным email
3. **Вход через username**: Проверь, что можно войти используя никнейм вместо email
4. **Google OAuth**: Проверь вход через Google (только после настройки OAuth в Google Cloud Console)
5. **Обновление профиля**: Зайди на главный экран, нажми на аватар и обнови данные профиля

## 🐛 Troubleshooting

### Ошибка: "Invalid login credentials"
- Проверь, что email подтвержден (check email inbox)
- Проверь правильность пароля (минимум 6 символов)

### Ошибка при входе через Google
- Убедись, что Google Provider включен в Supabase Dashboard
- Проверь, что Client ID и Client Secret правильно указаны
- Проверь Redirect URIs в Google Cloud Console

### Ошибка: "User with this username not found"
- Эта ошибка появляется, если пытаешься войти с несуществующим никнеймом
- Попробуй войти через email или зарегистрируйся заново

### RLS Policy Errors
- Если видишь ошибки доступа к данным, проверь что RLS политики применены:
  ```sql
  -- Проверь в Supabase SQL Editor
  SELECT tablename, policyname, permissive, roles, cmd, qual 
  FROM pg_policies 
  WHERE schemaname = 'public';
  ```

## 📚 Дополнительные ресурсы

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## ✨ Что дальше?

1. Настрой Google OAuth для production
2. Добавь другие провайдеры (Apple, Facebook, etc.)
3. Настрой 2FA (Two-Factor Authentication)
4. Добавь восстановление пароля
5. Настрой красивые email шаблоны

