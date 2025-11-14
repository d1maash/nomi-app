import { Transaction, AnomalyAlert } from '@/types';

/**
 * Детектор аномалий и потенциального фрода
 */

class AnomalyDetector {
  /**
   * Обнаружение аномалий в транзакциях
   */
  detect(transactions: Transaction[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];

    // 1. Поиск дубликатов (одинаковые суммы в один день)
    const duplicates = this.findDuplicates(transactions);
    alerts.push(...duplicates);

    // 2. Необычно большие суммы
    const unusualAmounts = this.findUnusualAmounts(transactions);
    alerts.push(...unusualAmounts);

    // 3. Необычное время (например, ночью)
    const unusualTimes = this.findUnusualTimes(transactions);
    alerts.push(...unusualTimes);

    return alerts.slice(0, 10); // Максимум 10 алертов
  }

  /**
   * Поиск дубликатов
   */
  private findDuplicates(transactions: Transaction[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const seen = new Map<string, Transaction[]>();

    // Группируем по дате + сумме
    for (const transaction of transactions) {
      const key = `${transaction.date.toString().split('T')[0]}-${transaction.amount}`;
      const existing = seen.get(key) || [];
      existing.push(transaction);
      seen.set(key, existing);
    }

    // Проверяем дубликаты
    for (const [key, group] of seen.entries()) {
      if (group.length >= 2) {
        const [firstTx, secondTx] = group;
        alerts.push({
          id: `duplicate-${firstTx.id}`,
          transactionId: firstTx.id,
          type: 'duplicate',
          severity: 'medium',
          message: `Обнаружены похожие транзакции на сумму ${firstTx.amount} ₸`,
          suggestion: 'Проверь, не была ли операция продублирована банком.',
          date: new Date(),
          dismissed: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Поиск необычно больших сумм
   */
  private findUnusualAmounts(transactions: Transaction[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];

    if (transactions.length < 10) return alerts;

    // Группируем по категориям
    const byCategory = new Map<string, number[]>();

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const amounts = byCategory.get(t.category) || [];
      amounts.push(t.amount);
      byCategory.set(t.category, amounts);
    }

    // Проверяем каждую категорию
    for (const [category, amounts] of byCategory.entries()) {
      if (amounts.length < 5) continue;

      // Вычисляем среднее и стандартное отклонение
      const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Проверяем последние транзакции
      const recentTransactions = transactions
        .filter((t) => t.category === category && t.type === 'expense')
        .slice(0, 5);

      for (const transaction of recentTransactions) {
        // Если сумма больше среднего + 2 стандартных отклонения
        if (transaction.amount > mean + 2 * stdDev && transaction.amount > mean * 2) {
          alerts.push({
            id: `unusual-${transaction.id}`,
            transactionId: transaction.id,
            type: 'unusual_amount',
            severity: 'high',
            message: `Необычно большая сумма: ${transaction.amount} ₸ при средней ${Math.round(mean)} ₸`,
            suggestion: 'Убедись, что это не ошибка или мошенническая операция.',
            date: new Date(),
            dismissed: false,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Поиск необычного времени транзакций
   */
  private findUnusualTimes(transactions: Transaction[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];

    // Проверяем последние 20 транзакций
    const recent = transactions.slice(0, 20);

    for (const transaction of recent) {
      const date = new Date(transaction.date);
      const hour = date.getHours();

      // Транзакции с 2 до 5 утра - подозрительны
      if (hour >= 2 && hour <= 5 && transaction.type === 'expense') {
        alerts.push({
          id: `time-${transaction.id}`,
          transactionId: transaction.id,
          type: 'unusual_time',
          severity: 'medium',
          message: `Транзакция в необычное время: ${hour}:00`,
          suggestion: 'Проверь операцию - возможно, это не твоя покупка.',
          date: new Date(),
          dismissed: false,
        });
      }
    }

    return alerts;
  }
}

export const anomalyDetector = new AnomalyDetector();

