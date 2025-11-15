# Архитектура Nomi App

## Обзор

Nomi — это iOS-first микробюджетинг-приложение с AI-функциями, построенное на React Native + Expo.

## Структура проекта

```
nomi-app/
├── app/                      # Экраны приложения (Expo Router)
│   ├── (tabs)/              # Основные вкладки приложения
│   │   ├── index.tsx        # Главная (дашборд)
│   │   ├── transactions.tsx # Транзакции
│   │   ├── budgets.tsx      # Бюджеты
│   │   ├── insights.tsx     # AI-инсайты и челленджи
│   │   └── settings.tsx     # Настройки
│   ├── auth.tsx             # Авторизация через Clerk
│   └── add-transaction.tsx  # Добавление транзакции
│
├── components/              # React-компоненты
│   ├── ui/                  # Базовые UI-компоненты
│   │   ├── button.tsx       # Кнопка с хаптикой
│   │   ├── card.tsx         # Карточка
│   │   ├── input.tsx        # Текстовое поле
│   │   ├── progress-bar.tsx # Прогресс-бар с анимацией
│   │   ├── badge.tsx        # Бейдж
│   │   ├── skeleton.tsx     # Скелетон для загрузки
│   │   └── empty-state.tsx  # Пустое состояние
│   ├── transaction-item.tsx # Элемент списка транзакций
│   └── category-selector.tsx# Селектор категорий
│
├── services/                # Бизнес-логика
│   ├── ai/                  # AI-модуль
│   │   ├── index.ts         # Главный AI-сервис
│   │   ├── categorization.ts# Автокатегоризация
│   │   ├── predictions.ts   # Прогнозы и ETA
│   │   ├── coaching.ts      # Инсайты и коучинг
│   │   ├── anomaly-detector.ts # Детектор аномалий
│   │   └── challenge-generator.ts # Генератор челленджей
│   ├── biometric.ts         # Биометрическая аутентификация
│   └── notifications.ts     # Локальные уведомления
│
├── store/                   # Глобальное состояние (Zustand)
│   └── index.ts             # Стор с транзакциями, бюджетами, целями
│
├── lib/                     # Утилиты и конфигурация
│   ├── storage.ts           # MMKV для офлайн-хранилища
│   └── clerk.ts             # Конфигурация Clerk
│
├── types/                   # TypeScript типы
│   └── index.ts             # Все типы приложения
│
├── constants/               # Константы
│   ├── app.ts               # Конфигурация приложения
│   └── categories.ts        # Категории, иконки, цвета
│
├── styles/                  # Стили
│   └── theme.ts             # Тёмная и светлая темы
│
└── utils/                   # Вспомогательные функции
    ├── format.ts            # Форматирование валют, дат
    └── haptics.ts           # Хаптический фидбек
```

## Технологический стек

### Core
- **React Native** — кроссплатформенная разработка
- **Expo** — инструменты разработки и сборки
- **TypeScript** — типизация

### Навигация
- **Expo Router** — файловая навигация

### Авторизация
- **Clerk** — OAuth (Apple, Google)

### Состояние
- **Zustand** — глобальный стор
- **MMKV** — быстрое офлайн-хранилище

### UI/UX
- **React Native Reanimated** — плавные анимации
- **Expo Haptics** — тактильная обратная связь
- **Expo Local Authentication** — Face ID / Touch ID

### AI/ML
- **Кастомный AI-модуль** — без привязки к провайдеру

## Ключевые паттерны

### 1. Офлайн-first

Все данные хранятся локально в MMKV:
```typescript
// Загрузка при старте
useEffect(() => {
  store.loadFromStorage();
}, []);

// Автосохранение при изменениях
store.saveToStorage();
```

### 2. Graceful AI Fallback

AI-функции работают опционально:
```typescript
if (!this.aiEnabled) {
  return { category: 'other', confidence: 0 };
}
```

### 3. iOS-оптимизация

- Биометрия для защиты входа
- Хаптика на ключевых действиях
- Системные шрифты и размеры тач-таргетов ≥44pt
- Плавные анимации 150-250ms

## Потоки данных

### Добавление транзакции

1. Пользователь вводит сумму и описание
2. AI предлагает категорию (confidence > 0.5)
3. Транзакция сохраняется в стор
4. Стор автоматически сохраняется в MMKV
5. UI обновляется через Zustand подписки

### Генерация инсайтов

1. Пользователь открывает экран инсайтов
2. AI анализирует историю транзакций
3. Генерируются персональные рекомендации
4. Предлагается новый челлендж на основе слабых мест

### Прогноз бюджета

1. Для каждого бюджета анализируются траты
2. AI вычисляет средний расход и тренд
3. Прогнозируется сумма до конца месяца
4. Рекомендуется буфер с учётом волатильности

## Безопасность

### Биометрическая блокировка

```typescript
// При старте приложения
if (biometricService.isBiometricLockEnabled()) {
  await biometricService.authenticate();
}
```

### Шифрование данных

MMKV использует encryption key для шифрования локальных данных:
```typescript
new MMKV({
  id: 'nomi-storage',
  encryptionKey: 'your-secure-key',
});
```

## Производительность

### Оптимизации
- FlatList для списков транзакций
- useMemo для фильтрации данных
- React.memo для компонентов
- Lazy loading для экранов
- Skeleton loaders вместо спиннеров

### Целевые метрики
- Время старта: < 1.5s
- FPS скролла: 60fps
- Время ответа UI: < 150ms

## Тестирование

### Unit тесты
```bash
npm test
```

### E2E тесты (опционально)
```bash
npm run test:e2e
```

## Развёртывание

### iOS
```bash
eas build --platform ios
```

### Android (если потребуется)
```bash
eas build --platform android
```

## Расширение функционала

### Добавление нового AI-провайдера

1. Создай файл `services/ai/providers/openai.ts`
2. Имплементируй интерфейс:
```typescript
interface AIProvider {
  categorize(description: string): Promise<CategoryResult>;
  predict(data: Transaction[]): Promise<PredictionResult>;
}
```
3. Подключи в `services/ai/index.ts`

### Добавление новой категории

1. Добавь в enum `TransactionCategory` (`types/index.ts`)
2. Добавь иконку в `CATEGORY_ICONS` (`constants/categories.ts`)
3. Добавь лейбл в `CATEGORY_LABELS`
4. Добавь правило в `categorization.ts`

## Лицензия

Приватный проект
