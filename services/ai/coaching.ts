import { Transaction, Budget, Goal, AIInsight, TransactionCategory, SpendingPattern } from '@/types';
import { startOfMonth, endOfMonth, differenceInDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Движок персонального коучинга и инсайтов
 */

class CoachingEngine {
  /**
   * Генерация персональных инсайтов
   */
  generateInsights(
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[]
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    // 1. Проверяем прогресс по бюджетам
    for (const budget of budgets) {
      const spent = this.calculateBudgetSpent(budget, transactions);
      const percentage = (spent / budget.limit) * 100;

      if (percentage >= 90) {
        insights.push({
          id: `budget-${budget.id}-${Date.now()}`,
          type: 'coaching',
          title: `Бюджет на ${this.getCategoryLabel(budget.category)} почти исчерпан`,
          message: `Вы потратили ${Math.round(percentage)}% лимита. Осталось ${Math.round(budget.limit - spent)} ₸ до конца периода.`,
          actionable: `Попробуй сократить траты на ${this.getCategoryLabel(budget.category)} на ${Math.round((spent - budget.limit * 0.8) / 7)} ₸ в день.`,
          priority: 'high',
          category: budget.category,
          date: new Date(),
          read: false,
        });
      }
    }

    // 2. Анализируем тренды расходов
    const patterns = this.analyzePatterns(transactions);
    for (const pattern of patterns) {
      if (pattern.trend === 'increasing') {
        insights.push({
          id: `trend-${pattern.category}-${Date.now()}`,
          type: 'coaching',
          title: `Расходы на ${this.getCategoryLabel(pattern.category)} растут`,
          message: `За последний месяц траты увеличились на ${Math.round((pattern.averageMonthly / (pattern.averageMonthly * 0.8) - 1) * 100)}%.`,
          actionable: `Попробуй установить лимит ${Math.round(pattern.averageMonthly * 1.1)} ₸ на этот месяц.`,
          priority: 'medium',
          category: pattern.category,
          date: new Date(),
          read: false,
        });
      }
    }

    // 3. Прогресс по целям
    for (const goal of goals) {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress >= 75 && progress < 100) {
        insights.push({
          id: `goal-${goal.id}-${Date.now()}`,
          type: 'coaching',
          title: `Почти у цели "${goal.name}"!`,
          message: `Ты уже накопил ${Math.round(progress)}% от цели. Осталось всего ${Math.round(goal.targetAmount - goal.currentAmount)} ₸.`,
          actionable: `Ещё ${Math.ceil((goal.targetAmount - goal.currentAmount) / (goal.currentAmount / differenceInDays(new Date(), new Date(goal.createdAt))))} дней при текущем темпе.`,
          priority: 'high',
          date: new Date(),
          read: false,
        });
      }
    }

    // 4. Сравнение с прошлым месяцем
    const thisMonthTotal = this.getMonthlyTotal(transactions, 0);
    const lastMonthTotal = this.getMonthlyTotal(transactions, 1);
    
    if (lastMonthTotal > 0) {
      const difference = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      
      if (difference < -10) {
        insights.push({
          id: `comparison-${Date.now()}`,
          type: 'coaching',
          title: 'Отличная экономия! 🎉',
          message: `В этом месяце ты потратил на ${Math.abs(Math.round(difference))}% меньше, чем в прошлом.`,
          actionable: `Ты сэкономил ${Math.round(lastMonthTotal - thisMonthTotal)} ₸. Продолжай в том же духе!`,
          priority: 'low',
          date: new Date(),
          read: false,
        });
      } else if (difference > 20) {
        insights.push({
          id: `comparison-${Date.now()}`,
          type: 'coaching',
          title: 'Траты выросли',
          message: `В этом месяце расходы на ${Math.round(difference)}% больше прошлого.`,
          actionable: `Проверь категории с максимальным ростом и попробуй их оптимизировать.`,
          priority: 'medium',
          date: new Date(),
          read: false,
        });
      }
    }

    // 5. Топ-3 категории расходов
    const categoryTotals = this.getCategoryTotals(transactions, 30);
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topCategories.length > 0) {
      const [topCategory, topAmount] = topCategories[0];
      insights.push({
        id: `top-category-${Date.now()}`,
        type: 'prediction',
        title: 'Твоя главная статья расходов',
        message: `${this.getCategoryLabel(topCategory as TransactionCategory)}: ${Math.round(topAmount)} ₸ за последний месяц.`,
        actionable: `Это ${Math.round((topAmount / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100)}% от всех трат.`,
        priority: 'low',
        category: topCategory as TransactionCategory,
        date: new Date(),
        read: false,
      });
    }

    return insights.slice(0, 5); // Возвращаем максимум 5 инсайтов
  }

  /**
   * Анализ паттернов расходов
   */
  analyzePatterns(transactions: Transaction[]): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const categories: TransactionCategory[] = [
      'food',
      'transport',
      'shopping',
      'entertainment',
      'coffee',
      'subscriptions',
    ];

    for (const category of categories) {
      const categoryTransactions = transactions.filter(
        (t) => t.category === category && t.type === 'expense'
      );

      if (categoryTransactions.length < 5) continue;

      // Подсчёт средних значений
      const last30Days = categoryTransactions.filter((t) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(t.date) >= thirtyDaysAgo;
      });

      const last60Days = categoryTransactions.filter((t) => {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return new Date(t.date) >= sixtyDaysAgo;
      });

      const monthlyTotal = last30Days.reduce((sum, t) => sum + t.amount, 0);
      const previousMonthTotal = last60Days
        .filter((t) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(t.date) < thirtyDaysAgo;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (monthlyTotal > previousMonthTotal * 1.15) {
        trend = 'increasing';
      } else if (monthlyTotal < previousMonthTotal * 0.85) {
        trend = 'decreasing';
      }

      patterns.push({
        category,
        averageDaily: monthlyTotal / 30,
        averageWeekly: monthlyTotal / 4.33,
        averageMonthly: monthlyTotal,
        trend,
      });
    }

    return patterns;
  }

  /**
   * Вспомогательные методы
   */
  private calculateBudgetSpent(budget: Budget, transactions: Transaction[]): number {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);

    return transactions
      .filter(
        (t) =>
          t.category === budget.category &&
          t.type === 'expense' &&
          new Date(t.date) >= budgetStart &&
          new Date(t.date) <= budgetEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getMonthlyTotal(transactions: Transaction[], monthsAgo: number): number {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date) >= start &&
          new Date(t.date) <= end
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getCategoryTotals(transactions: Transaction[], days: number): Record<string, number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const totals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= cutoffDate)
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });

    return totals;
  }

  private getCategoryLabel(category: TransactionCategory): string {
    const labels: Record<TransactionCategory, string> = {
      food: 'еду',
      transport: 'транспорт',
      shopping: 'покупки',
      entertainment: 'развлечения',
      utilities: 'коммуналку',
      healthcare: 'здоровье',
      education: 'образование',
      gifts: 'подарки',
      coffee: 'кофе',
      subscriptions: 'подписки',
      income: 'доход',
      other: 'другое',
    };
    return labels[category] || category;
  }
}

export const coachingEngine = new CoachingEngine();

