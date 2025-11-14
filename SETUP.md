# Установка и запуск Nomi App

## Требования

- Node.js 18+
- npm или yarn
- iOS Simulator (для разработки на macOS)
- Xcode (для iOS сборки)
- Expo CLI

## Быстрый старт

### 1. Установка зависимостей

```bash
cd nomi-app
npm install
```

### 2. Конфигурация Clerk

Создай файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Зарегистрируйся на [clerk.com](https://clerk.com) и получи Publishable Key:

1. Создай новое приложение
2. Перейди в API Keys
3. Скопируй `Publishable Key`
4. Добавь в `.env`:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. ⚠️ ВАЖНО: Включи Native API в Clerk

**Это обязательный шаг для работы OAuth в мобильном приложении!**

1. Открой [Clerk Dashboard](https://dashboard.clerk.com)
2. Перейди в **Configure → Native applications**
   - Или напрямую: https://dashboard.clerk.com/last-active?path=native-applications
3. Включи **"Enable Native API"**
4. Сохрани изменения

Без этого шага OAuth не будет работать! ❌

### 4. Настройка OAuth провайдеров

В дашборде Clerk:

#### Google Sign In (Рекомендуется начать с него)
1. Перейди в `Configure → SSO Connections` → `Google`
2. Нажми **"Enable"**
3. **Для разработки:**
   - Clerk автоматически предоставляет тестовые credentials
   - Можешь сразу тестировать! ✅
4. **Для продакшена (опционально):**
   - Создай OAuth Client в [Google Cloud Console](https://console.cloud.google.com)
   - Добавь свой Client ID и Secret

#### Apple Sign In (Для продакшена)
1. Перейди в `Configure → SSO Connections` → `Apple`
2. Следуй инструкциям по настройке Apple Developer Account
3. Добавь Bundle ID приложения
4. Загрузи сертификаты

**Примечание:** Для разработки начни с Google - он работает "из коробки"!

### 5. Запуск приложения

```bash
npm start
```

Это откроет Expo Dev Tools. Выбери:
- `i` — запустить в iOS Simulator
- `a` — запустить в Android Emulator
- Scan QR code — запустить на физическом устройстве

### 6. Разработка

```bash
# iOS
npm run ios

# Android
npm run android

# Web (для быстрой разработки UI)
npm run web
```

## Структура проекта

См. [ARCHITECTURE.md](./ARCHITECTURE.md) для подробной документации.

## Конфигурация биометрии

Биометрическая аутентификация (Face ID / Touch ID) работает автоматически на физических устройствах.

Для тестирования в симуляторе:
1. Simulator → Features → Face ID / Touch ID → Enrolled
2. При запросе авторизации → Matching Face/Touch

## Локальные уведомления

Разрешения запрашиваются автоматически при первом запуске.

Для тестирования:
1. Разреши уведомления в настройках приложения
2. Уведомления появятся согласно расписанию:
   - Начало месяца: 9:00 (Smart-бюджет)
   - Прогресс по целям: по триггеру
   - Близость к лимиту: по триггеру

## Сборка для продакшена

### iOS

1. Настрой EAS:
```bash
npx eas-cli login
npx eas build:configure
```

2. Обнови `app.json`:
```json
{
  "expo": {
    "name": "Nomi",
    "slug": "nomi-app",
    "ios": {
      "bundleIdentifier": "com.yourcompany.nomi"
    }
  }
}
```

3. Собери:
```bash
npx eas build --platform ios
```

4. Загрузи в TestFlight:
```bash
npx eas submit --platform ios
```

### Android (опционально)

```bash
npx eas build --platform android
```

## Тестирование

```bash
# Unit тесты
npm test

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Отладка

### React Native Debugger

1. Установи [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Запусти приложение
3. Открой Dev Menu (`Cmd+D` в Simulator)
4. Выбери "Debug"

### Flipper

```bash
npx expo install react-native-flipper
```

Flipper даёт доступ к:
- Network requests
- AsyncStorage/MMKV
- Layout Inspector
- Performance

## Решение проблем

### Clerk ошибка: "Native API is disabled"

Эта ошибка означает, что не включен Native API в Clerk:

1. Открой https://dashboard.clerk.com/last-active?path=native-applications
2. Включи **"Enable Native API"**
3. Перезапусти приложение

### Clerk не инициализируется

Проверь `.env`:
```bash
cat .env | grep CLERK
```

Ключ должен начинаться с `pk_test_` или `pk_live_`.

Убедись, что перезапустил приложение после создания `.env`:
```bash
npx expo start --clear
```

### OAuth окно не открывается

1. Проверь, что Native API включен (см. выше)
2. Проверь, что Google OAuth включен в Clerk Dashboard
3. Проверь логи в терминале для деталей ошибки
4. Убедись, что `expo-web-browser` установлен:
```bash
npx expo install expo-web-browser
```

### Биометрия не работает

- На симуляторе: проверь, что Face ID enrolled
- На устройстве: проверь разрешения в Settings → Nomi → Face ID

### MMKV ошибки

```bash
cd ios
pod install
cd ..
npm run ios
```

### TypeScript ошибки

```bash
npm run typecheck
```

## Полезные команды

```bash
# Очистить кэш
npx expo start --clear

# Сбросить Metro bundler
npx expo start --reset-cache

# Обновить зависимости
npx expo install --fix

# Проверить обновления Expo
npx expo-doctor
```

## Следующие шаги

1. Изучи [ARCHITECTURE.md](./ARCHITECTURE.md) для понимания структуры
2. Прочитай [AI_PROVIDERS.md](./AI_PROVIDERS.md) для подключения ML-моделей
3. Кастомизируй тему в `styles/theme.ts`
4. Добавь свои категории в `constants/categories.ts`

## Поддержка

Возникли вопросы? Проверь:
- [Expo Docs](https://docs.expo.dev)
- [Clerk Docs](https://clerk.com/docs)
- [React Navigation Docs](https://reactnavigation.org)

