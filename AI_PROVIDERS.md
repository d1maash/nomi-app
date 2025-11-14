# Подключение AI-провайдеров

AI-модуль Nomi спроектирован без привязки к конкретному провайдеру. Ниже инструкции по интеграции популярных AI-сервисов.

## Текущая реализация

Сейчас AI работает на основе правил и статистического анализа:
- **Категоризация**: поиск ключевых слов
- **Прогнозы**: расчёт трендов и средних значений
- **Инсайты**: анализ паттернов расходов
- **Аномалии**: статистическое отклонение

Это обеспечивает:
✅ Работу без интернета  
✅ Мгновенный отклик  
✅ Полную приватность  

Но можно улучшить качество, подключив ML-модели.

---

## Вариант 1: OpenAI API

### Установка

```bash
npm install openai
```

### Конфигурация

Создай `.env`:
```bash
OPENAI_API_KEY=sk-...
```

### Интеграция

Создай `services/ai/providers/openai-provider.ts`:

```typescript
import OpenAI from 'openai';
import { TransactionCategory } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function categorizeWithGPT(
  description: string,
  amount: number
): Promise<{ category: TransactionCategory; confidence: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Ты — финансовый помощник. Определи категорию транзакции.
Доступные категории: food, transport, shopping, entertainment, coffee, subscriptions, utilities, healthcare, education, gifts, other.
Ответь в формате JSON: { "category": "...", "confidence": 0-1 }`,
        },
        {
          role: 'user',
          content: `Описание: "${description}", Сумма: ${amount} KZT`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      category: result.category || 'other',
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return { category: 'other', confidence: 0 };
  }
}
```

Подключи в `services/ai/categorization.ts`:

```typescript
import { categorizeWithGPT } from './providers/openai-provider';

categorize(description: string, amount: number) {
  // Сначала пытаемся GPT
  const gptResult = await categorizeWithGPT(description, amount);
  if (gptResult.confidence > 0.7) {
    return gptResult;
  }
  
  // Fallback на правила
  return this.categorizeByRules(description, amount);
}
```

---

## Вариант 2: Anthropic Claude

### Установка

```bash
npm install @anthropic-ai/sdk
```

### Конфигурация

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Интеграция

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function categorizeWithClaude(
  description: string,
  amount: number
): Promise<{ category: TransactionCategory; confidence: number }> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Определи категорию транзакции: "${description}", ${amount} KZT. 
Категории: food, transport, shopping, entertainment, coffee, subscriptions, utilities, healthcare, education, gifts, other.
Ответь JSON: {"category": "...", "confidence": 0.0-1.0}`,
        },
      ],
    });

    const result = JSON.parse(message.content[0].text);
    return result;
  } catch (error) {
    console.error('Claude error:', error);
    return { category: 'other', confidence: 0 };
  }
}
```

---

## Вариант 3: On-Device ML (TensorFlow Lite)

Для полной приватности можно использовать локальную модель.

### Установка

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
```

### Обучение модели

1. Собери датасет из транзакций пользователя
2. Обучи классификатор (например, naive bayes или small transformer)
3. Экспортируй в TFLite

### Интеграция

```typescript
import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel;

export async function loadModel() {
  model = await tf.loadLayersModel('path/to/model.json');
}

export async function categorizeWithML(description: string): Promise<TransactionCategory> {
  const tokens = tokenize(description);
  const tensor = tf.tensor2d([tokens]);
  const prediction = model.predict(tensor) as tf.Tensor;
  const categoryIndex = prediction.argMax(-1).dataSync()[0];
  return categories[categoryIndex];
}
```

---

## Вариант 4: Гибридный подход (рекомендуется)

Комбинируй несколько методов:

```typescript
export async function smartCategorize(
  description: string,
  amount: number
): Promise<{ category: TransactionCategory; confidence: number }> {
  // 1. Проверяем кэш пользовательских правок
  const userRule = getUserRule(description);
  if (userRule) {
    return { category: userRule, confidence: 1.0 };
  }

  // 2. Пытаемся локальные правила (быстро, офлайн)
  const ruleResult = categorizeByRules(description, amount);
  if (ruleResult.confidence > 0.8) {
    return ruleResult;
  }

  // 3. Если онлайн и разрешено — используем GPT
  if (isOnline() && aiSettings.useExternalAI) {
    const gptResult = await categorizeWithGPT(description, amount);
    if (gptResult.confidence > 0.7) {
      return gptResult;
    }
  }

  // 4. Fallback на локальную модель
  const mlResult = await categorizeWithML(description);
  return { category: mlResult, confidence: 0.6 };
}
```

---

## Обучение на данных пользователя

Когда пользователь исправляет категорию, сохраняй правило:

```typescript
export function learnFromUserCorrection(
  description: string,
  suggestedCategory: TransactionCategory,
  correctCategory: TransactionCategory
) {
  const userRules = storageUtils.get<Record<string, TransactionCategory>>('user_rules') || {};
  
  // Извлекаем ключевые слова
  const keywords = extractKeywords(description);
  keywords.forEach((keyword) => {
    userRules[keyword.toLowerCase()] = correctCategory;
  });

  storageUtils.set('user_rules', userRules);
}
```

При следующей категоризации сначала проверяем эти правила.

---

## Оптимизация затрат

### Кэширование

```typescript
const cache = new Map<string, CategoryResult>();

export async function categorizeWithCache(description: string) {
  const key = description.toLowerCase().trim();
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const result = await categorizeWithGPT(description, 0);
  cache.set(key, result);
  return result;
}
```

### Батчинг

Вместо отдельных запросов для каждой транзакции, отправляй батчами:

```typescript
export async function categorizeBatch(transactions: string[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: `Категоризуй эти транзакции: ${JSON.stringify(transactions)}`,
      },
    ],
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## Мониторинг качества

Отслеживай точность AI:

```typescript
interface AIMetrics {
  totalPredictions: number;
  userCorrections: number;
  accuracy: number;
}

export function trackAIAccuracy(
  predicted: TransactionCategory,
  actual: TransactionCategory
) {
  const metrics = storageUtils.get<AIMetrics>('ai_metrics') || {
    totalPredictions: 0,
    userCorrections: 0,
    accuracy: 0,
  };

  metrics.totalPredictions++;
  
  if (predicted !== actual) {
    metrics.userCorrections++;
  }

  metrics.accuracy = 1 - metrics.userCorrections / metrics.totalPredictions;
  
  storageUtils.set('ai_metrics', metrics);
}
```

---

## Приватность

⚠️ **Важно**: при использовании внешних AI-сервисов:

1. Добавь явное согласие пользователя
2. Не отправляй персональные данные (имена, номера карт)
3. Используй анонимизацию описаний
4. Дай возможность отключить внешний AI

```typescript
if (!settings.privacy.useExternalAI) {
  return categorizeByRulesOnly(description);
}
```

---

## Итоговая структура

```
services/ai/
├── index.ts                 # Главный AI-сервис (уже есть)
├── categorization.ts        # Логика категоризации (уже есть)
├── predictions.ts           # Прогнозы (уже есть)
├── coaching.ts              # Инсайты (уже есть)
├── providers/               # ⬅️ Новая папка для AI-провайдеров
│   ├── openai-provider.ts   # GPT-4 интеграция
│   ├── claude-provider.ts   # Claude интеграция
│   └── local-ml.ts          # TensorFlow Lite
└── cache.ts                 # Кэш результатов
```

---

## Рекомендации

Для MVP:
✅ Используй текущую реализацию на правилах  
✅ Добавь кэш пользовательских правок  

Для улучшения:
✅ Подключи OpenAI/Claude для сложных случаев  
✅ Используй fallback на правила при отсутствии интернета  

Для максимальной приватности:
✅ Обучи локальную TFLite модель  
✅ Периодически дообучай на данных пользователя  

