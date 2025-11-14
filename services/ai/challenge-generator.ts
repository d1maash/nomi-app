import { Transaction, Budget, Challenge, TransactionCategory, Badge } from '@/types';

/**
 * Генератор персональных челленджей
 */

interface ChallengeTemplate {
  type: 'spending' | 'saving' | 'category';
  title: string;
  description: string;
  duration: number;
  targetCategory?: TransactionCategory;
  badge: Omit<Badge, 'earnedAt'>;
}

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    type: 'category',
    title: 'Неделя без кофеен',
    description: 'Не трать деньги на кофе вне дома целую неделю',
    duration: 7,
    targetCategory: 'coffee',
    badge: {
      id: 'coffee-breaker',
      name: 'Coffee Breaker',
      icon: 'coffee',
      description: 'Неделя без кофе вне дома',
      category: 'coffee',
    },
  },
  {
    type: 'category',
    title: 'Транспортная экономия',
    description: 'Сократи расходы на транспорт на 30%',
    duration: 7,
    targetCategory: 'transport',
    badge: {
      id: 'transport-ninja',
      name: 'Transport Ninja',
      icon: 'navigation',
      description: 'Неделя экономии на транспорте',
      category: 'transport',
    },
  },
  {
    type: 'category',
    title: 'Готовим дома',
    description: 'Не заказывай еду на доставку 5 дней подряд',
    duration: 5,
    targetCategory: 'food',
    badge: {
      id: 'home-chef',
      name: 'Home Chef',
      icon: 'home',
      description: '5 дней без доставки еды',
      category: 'food',
    },
  },
  {
    type: 'spending',
    title: 'Минималист',
    description: 'Не трать больше 5000 ₸ в день',
    duration: 7,
    badge: {
      id: 'minimalist',
      name: 'Minimalist',
      icon: 'minus-circle',
      description: 'Неделя минимальных трат',
      category: 'general',
    },
  },
  {
    type: 'category',
    title: 'Без импульсивных покупок',
    description: 'Покупай только запланированное',
    duration: 7,
    targetCategory: 'shopping',
    badge: {
      id: 'smart-shopper',
      name: 'Smart Shopper',
      icon: 'shopping-bag',
      description: 'Неделя без импульсивных покупок',
      category: 'shopping',
    },
  },
  {
    type: 'saving',
    title: 'Копилка',
    description: 'Отложи 10% от каждого дохода',
    duration: 14,
    badge: {
      id: 'saver',
      name: 'Saver',
      icon: 'dollar-sign',
      description: '2 недели накоплений',
      category: 'general',
    },
  },
];

class ChallengeGenerator {
  /**
   * Генерация персонального челленджа на основе слабых мест
   */
  generate(
    transactions: Transaction[],
    budgets: Budget[],
    completedChallenges: Challenge[]
  ): Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'> | null {
    // Находим проблемные категории
    const problemCategories = this.findProblemCategories(transactions, budgets);

    // Фильтруем уже пройденные челленджи
    const completedTypes = new Set(
      completedChallenges.map((c) => `${c.type}-${c.targetCategory || 'general'}`)
    );

    // Выбираем подходящие шаблоны
    const availableTemplates = CHALLENGE_TEMPLATES.filter((template) => {
      const key = `${template.type}-${template.targetCategory || 'general'}`;
      if (completedTypes.has(key)) return false;

      // Если это категориальный челлендж, проверяем, есть ли проблемы в этой категории
      if (template.targetCategory) {
        return problemCategories.includes(template.targetCategory);
      }

      return true;
    });

    if (availableTemplates.length === 0) {
      // Все челленджи пройдены или нет подходящих
      return null;
    }

    // Выбираем случайный шаблон из доступных
    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    // Формируем челлендж
    const challenge: Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'> = {
      title: template.title,
      description: template.description,
      type: template.type,
      targetCategory: template.targetCategory,
      duration: template.duration,
      startDate: new Date(),
      endDate: new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000),
      badge: template.badge,
    };

    // Для spending-челленджей добавляем целевую сумму
    if (template.type === 'spending') {
      const avgDailySpending = this.calculateAverageDailySpending(transactions);
      challenge.targetAmount = avgDailySpending * 0.7; // 30% экономии
    }

    // Для category-челленджей тоже можем добавить целевую сумму
    if (template.targetCategory) {
      const categoryAvg = this.calculateCategoryAverage(
        transactions,
        template.targetCategory,
        7
      );
      challenge.targetAmount = categoryAvg * 0.7; // 30% сокращения
    }

    return challenge;
  }

  /**
   * Находим проблемные категории (где траты растут или превышают бюджет)
   */
  private findProblemCategories(
    transactions: Transaction[],
    budgets: Budget[]
  ): TransactionCategory[] {
    const problems: TransactionCategory[] = [];

    // Проверяем превышение бюджетов
    for (const budget of budgets) {
      const spent = transactions
        .filter(
          (t) =>
            t.category === budget.category &&
            t.type === 'expense' &&
            new Date(t.date) >= new Date(budget.startDate) &&
            new Date(t.date) <= new Date(budget.endDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent / budget.limit >= 0.8) {
        problems.push(budget.category);
      }
    }

    // Проверяем тренды
    const categories: TransactionCategory[] = ['coffee', 'transport', 'food', 'shopping'];
    for (const category of categories) {
      const last7Days = this.calculateCategoryAverage(transactions, category, 7);
      const previous7Days = this.calculateCategoryAverage(transactions, category, 7, 7);

      if (last7Days > previous7Days * 1.3) {
        problems.push(category);
      }
    }

    return [...new Set(problems)]; // убираем дубликаты
  }

  /**
   * Средний дневной расход
   */
  private calculateAverageDailySpending(transactions: Transaction[]): number {
    const last30Days = transactions.filter((t) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo;
    });

    if (last30Days.length === 0) return 0;

    const total = last30Days.reduce((sum, t) => sum + t.amount, 0);
    return total / 30;
  }

  /**
   * Средний расход по категории
   */
  private calculateCategoryAverage(
    transactions: Transaction[],
    category: TransactionCategory,
    days: number,
    offset: number = 0
  ): number {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - offset);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);

    const filtered = transactions.filter(
      (t) =>
        t.category === category &&
        t.type === 'expense' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
    );

    if (filtered.length === 0) return 0;

    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }
}

export const challengeGenerator = new ChallengeGenerator();

