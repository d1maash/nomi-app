import { Transaction, TransactionCategory, Budget, Goal } from '@/types';
import { startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns';

/**
 * Движок предсказаний и прогнозов
 */

class PredictionEngine {
  /**
   * Прогноз расходов на будущий период
   */
  predictSpending(
    transactions: Transaction[],
    category: TransactionCategory,
    daysAhead: number
  ): {
    predictedAmount: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendation: string;
  } {
    // Фильтруем транзакции по категории и типу (только расходы)
    const categoryTransactions = transactions.filter(
      (t) => t.category === category && t.type === 'expense'
    );

    if (categoryTransactions.length === 0) {
      return {
        predictedAmount: 0,
        confidence: 0,
        trend: 'stable',
        recommendation: 'Недостаточно данных для прогноза',
      };
    }

    // Вычисляем средний дневной расход
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const oldestDate = new Date(
      Math.min(...categoryTransactions.map((t) => new Date(t.date).getTime()))
    );
    const daysCovered = differenceInDays(new Date(), oldestDate) || 1;
    const avgDailySpend = totalSpent / daysCovered;

    // Анализируем тренд (последние 30 дней vs предыдущие 30)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentTransactions = categoryTransactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo
    );
    const olderTransactions = categoryTransactions.filter(
      (t) => new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo
    );

    const recentAvg = recentTransactions.length
      ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length
      : 0;
    const olderAvg = olderTransactions.length
      ? olderTransactions.reduce((sum, t) => sum + t.amount, 0) / olderTransactions.length
      : recentAvg;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendMultiplier = 1;

    if (recentAvg > olderAvg * 1.15) {
      trend = 'increasing';
      trendMultiplier = 1.1;
    } else if (recentAvg < olderAvg * 0.85) {
      trend = 'decreasing';
      trendMultiplier = 0.9;
    }

    // Прогноз
    const predictedAmount = avgDailySpend * daysAhead * trendMultiplier;
    const confidence = Math.min(categoryTransactions.length / 20, 0.9);

    // Генерируем рекомендацию
    let recommendation = '';
    if (trend === 'increasing') {
      recommendation = `Расходы растут. Попробуй сократить на ${Math.round((trendMultiplier - 1) * 100)}% в этом месяце.`;
    } else if (trend === 'decreasing') {
      recommendation = `Отлично! Расходы снижаются. Продолжай в том же духе.`;
    } else {
      recommendation = `Расходы стабильны. Всё под контролем.`;
    }

    return {
      predictedAmount: Math.round(predictedAmount),
      confidence,
      trend,
      recommendation,
    };
  }

  /**
   * Рекомендация буфера для бюджета
   */
  recommendBuffer(
    budget: Budget,
    transactions: Transaction[]
  ): {
    recommendedBuffer: number;
    reason: string;
  } {
    // Анализируем волатильность расходов в категории
    const categoryTransactions = transactions
      .filter((t) => t.category === budget.category && t.type === 'expense')
      .slice(0, 30); // последние 30 транзакций

    if (categoryTransactions.length < 5) {
      return {
        recommendedBuffer: budget.limit * 0.1,
        reason: 'Стандартный буфер 10% (недостаточно истории)',
      };
    }

    // Вычисляем стандартное отклонение
    const amounts = categoryTransactions.map((t) => t.amount);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Коэффициент вариации (чем выше, тем более непредсказуемы расходы)
    const cv = stdDev / mean;

    let bufferPercent = 0.1; // 10% по умолчанию
    let reason = 'Стандартный буфер';

    if (cv > 0.5) {
      bufferPercent = 0.2;
      reason = 'Высокая волатильность расходов - рекомендую больший буфер';
    } else if (cv > 0.3) {
      bufferPercent = 0.15;
      reason = 'Средняя волатильность - небольшой дополнительный буфер';
    } else {
      reason = 'Стабильные расходы - стандартный буфер';
    }

    return {
      recommendedBuffer: Math.round(budget.limit * bufferPercent),
      reason,
    };
  }

  /**
   * Расчёт ETA для цели
   */
  calculateGoalETA(
    goal: Goal,
    transactions: Transaction[]
  ): {
    estimatedDate: Date;
    recommendedWeeklySaving: number;
    riskLevel: 'low' | 'medium' | 'high';
    note: string;
  } {
    const remaining = goal.targetAmount - goal.currentAmount;

    if (remaining <= 0) {
      return {
        estimatedDate: new Date(),
        recommendedWeeklySaving: 0,
        riskLevel: 'low',
        note: 'Цель уже достигнута! 🎉',
      };
    }

    // Анализируем средний доход
    const incomeTransactions = transactions.filter((t) => t.type === 'income');
    const recentIncome = incomeTransactions
      .filter((t) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(t.date) >= thirtyDaysAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Анализируем средние расходы
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const recentExpenses = expenseTransactions
      .filter((t) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(t.date) >= thirtyDaysAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Потенциал накопления = доход - расходы
    const monthlySavingPotential = recentIncome - recentExpenses;
    const weeklySavingPotential = monthlySavingPotential / 4.33; // среднее количество недель в месяце

    // Рекомендуем 70% от потенциала (оставляем буфер)
    const recommendedWeeklySaving = Math.max(
      Math.round(weeklySavingPotential * 0.7),
      Math.round(remaining / 52) // минимум - достижение за год
    );

    // Рассчитываем сколько недель потребуется
    const weeksNeeded = Math.ceil(remaining / recommendedWeeklySaving);
    const estimatedDate = addDays(new Date(), weeksNeeded * 7);

    // Оцениваем риск
    const daysUntilDeadline = differenceInDays(new Date(goal.deadline), new Date());
    const daysNeeded = weeksNeeded * 7;

    let riskLevel: 'low' | 'medium' | 'high';
    let note: string;

    if (daysNeeded <= daysUntilDeadline * 0.7) {
      riskLevel = 'low';
      note = 'Цель легко достижима при текущем темпе накоплений';
    } else if (daysNeeded <= daysUntilDeadline * 1.2) {
      riskLevel = 'medium';
      note = 'Потребуется дисциплина, но цель достижима';
    } else {
      riskLevel = 'high';
      note = `Для достижения в срок потребуется откладывать ${Math.round(remaining / (daysUntilDeadline / 7))} ₸ в неделю`;
    }

    return {
      estimatedDate,
      recommendedWeeklySaving,
      riskLevel,
      note,
    };
  }
}

export const predictionEngine = new PredictionEngine();

