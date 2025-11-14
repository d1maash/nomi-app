import { storageKeys, storageUtils } from '@/lib/storage';
import { TransactionCategory } from '@/types';

/**
 * Движок автокатегоризации транзакций
 * Использует правила и ключевые слова для определения категории
 * В продакшене можно заменить на ML-модель или API
 */

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  priority: number;
}

const CATEGORIZATION_RULES: CategoryRule[] = [
  // Кофе и кафе
  {
    category: 'coffee',
    keywords: ['starbucks', 'coffee', 'кофе', 'coffeeshop', 'кофейня', 'cafe', 'кафе'],
    priority: 10,
  },
  // Транспорт
  {
    category: 'transport',
    keywords: ['taxi', 'uber', 'bolt', 'яндекс.такси', 'метро', 'metro', 'бензин', 'gas', 'автобус', 'bus', 'parking', 'парковка'],
    priority: 9,
  },
  // Еда
  {
    category: 'food',
    keywords: ['restaurant', 'ресторан', 'макдональдс', 'kfc', 'burger', 'pizza', 'пицца', 'delivery', 'доставка', 'glovo', 'wolt', 'supermarket', 'магазин', 'grocery'],
    priority: 8,
  },
  // Подписки
  {
    category: 'subscriptions',
    keywords: ['netflix', 'spotify', 'youtube', 'premium', 'subscription', 'подписка', 'apple music', 'icloud'],
    priority: 10,
  },
  // Развлечения
  {
    category: 'entertainment',
    keywords: ['cinema', 'кино', 'theater', 'театр', 'concert', 'концерт', 'game', 'игра', 'steam', 'playstation'],
    priority: 7,
  },
  // Покупки
  {
    category: 'shopping',
    keywords: ['amazon', 'ozon', 'wildberries', 'kaspi', 'market', 'shop', 'магазин', 'store'],
    priority: 6,
  },
  // Коммуналка
  {
    category: 'utilities',
    keywords: ['electricity', 'электричество', 'water', 'вода', 'gas', 'газ', 'internet', 'интернет', 'mobile', 'мобильная связь'],
    priority: 9,
  },
  // Здоровье
  {
    category: 'healthcare',
    keywords: ['pharmacy', 'аптека', 'hospital', 'больница', 'doctor', 'врач', 'clinic', 'клиника', 'medical', 'медицина'],
    priority: 8,
  },
  // Образование
  {
    category: 'education',
    keywords: ['course', 'курс', 'udemy', 'coursera', 'education', 'образование', 'book', 'книга', 'university', 'университет'],
    priority: 7,
  },
  // Подарки
  {
    category: 'gifts',
    keywords: ['gift', 'подарок', 'present', 'flowers', 'цветы'],
    priority: 8,
  },
];

type CorrectionEntry = {
  tokens: string[];
  category: TransactionCategory;
  updatedAt: number;
};

const MAX_CORRECTIONS = 40;

class CategorizationEngine {
  private corrections: CorrectionEntry[] = [];

  constructor() {
    void this.loadCorrections();
  }

  /**
   * Категоризация по описанию и сумме
   */
  categorize(description: string, amount: number): {
    category: TransactionCategory;
    confidence: number;
    alternatives?: TransactionCategory[];
  } {
    const normalizedDesc = description.toLowerCase();

    const learnedCategory = this.getLearnedCategory(normalizedDesc);
    if (learnedCategory) {
      return {
        category: learnedCategory,
        confidence: 0.92,
      };
    }

    const matches: { category: TransactionCategory; score: number }[] = [];

    // Проверяем каждое правило
    for (const rule of CATEGORIZATION_RULES) {
      let score = 0;
      for (const keyword of rule.keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          score += rule.priority;
        }
      }
      if (score > 0) {
        matches.push({ category: rule.category, score });
      }
    }

    // Сортируем по score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      // Пытаемся угадать по сумме
      return this.categorizeBySumme(amount);
    }

    const topMatch = matches[0];
    const confidence = Math.min(topMatch.score / 20, 0.95); // Нормализуем до 0-1
    const alternatives = matches.slice(1, 3).map((m) => m.category);

    return {
      category: topMatch.category,
      confidence,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  /**
   * Fallback категоризация по сумме
   */
  private categorizeBySumme(amount: number): {
    category: TransactionCategory;
    confidence: number;
  } {
    // Маленькие суммы (до 2000) - возможно кофе или транспорт
    if (amount <= 2000) {
      return { category: 'coffee', confidence: 0.3 };
    }
    // Средние суммы (2000-10000) - возможно еда
    if (amount <= 10000) {
      return { category: 'food', confidence: 0.4 };
    }
    // Большие суммы - другое
    return { category: 'other', confidence: 0.2 };
  }

  /**
   * Обучение на основе исправлений пользователя
   * В продакшене здесь можно сохранять правки и улучшать модель
   */
  async learnFromCorrection(
    description: string,
    suggestedCategory: TransactionCategory,
    correctCategory: TransactionCategory
  ) {
    if (!description || correctCategory === suggestedCategory) {
      return;
    }

    const tokens = this.extractTokens(description);
    if (tokens.length === 0) {
      return;
    }

    const newEntry: CorrectionEntry = {
      tokens,
      category: correctCategory,
      updatedAt: Date.now(),
    };

    this.corrections = [
      newEntry,
      ...this.corrections.filter(
        (entry) =>
          entry.category !== newEntry.category ||
          entry.tokens.join('|') !== newEntry.tokens.join('|')
      ),
    ].slice(0, MAX_CORRECTIONS);

    await storageUtils.set(storageKeys.CATEGORY_CORRECTIONS, this.corrections);
  }

  private async loadCorrections() {
    try {
      const stored = await storageUtils.get<CorrectionEntry[]>(storageKeys.CATEGORY_CORRECTIONS);
      if (stored) {
        this.corrections = stored;
      }
    } catch (error) {
      console.error('Failed to load categorization corrections', error);
    }
  }

  private getLearnedCategory(normalizedDesc: string): TransactionCategory | null {
    for (const entry of this.corrections) {
      const hasMatch = entry.tokens.some(
        (token) => token.length > 0 && normalizedDesc.includes(token)
      );
      if (hasMatch) {
        return entry.category;
      }
    }
    return null;
  }

  private extractTokens(description: string): string[] {
    return description
      .toLowerCase()
      .split(/[^a-zA-Zа-яА-Я0-9]+/g)
      .filter((token) => token.length >= 3)
      .slice(0, 4);
  }
}

export const categorizationEngine = new CategorizationEngine();
