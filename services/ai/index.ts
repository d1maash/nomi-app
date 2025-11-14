/**
 * AI-модуль для анализа финансов
 * 
 * Этот модуль предоставляет AI-функции без привязки к конкретному провайдеру.
 * Можно легко интегрировать OpenAI, Anthropic, или локальные модели.
 * 
 * Все функции работают с graceful fallback - если AI недоступен,
 * возвращаются разумные значения по умолчанию.
 */

import { Transaction, TransactionCategory, Budget, Goal, AIInsight, Challenge, SpendingPattern, AnomalyAlert } from '@/types';
import { categorizationEngine } from './categorization';
import { predictionEngine } from './predictions';
import { coachingEngine } from './coaching';
import { anomalyDetector } from './anomaly-detector';
import { challengeGenerator } from './challenge-generator';

export class AIService {
  private aiEnabled: boolean = true;

  /**
   * Включить/выключить AI-функции
   */
  setAIEnabled(enabled: boolean) {
    this.aiEnabled = enabled;
  }

  /**
   * Автоматическая категоризация транзакции
   */
  async categorizeTransaction(description: string, amount: number): Promise<{
    category: TransactionCategory;
    confidence: number;
    alternatives?: TransactionCategory[];
  }> {
    if (!this.aiEnabled) {
      return { category: 'other', confidence: 0 };
    }

    return categorizationEngine.categorize(description, amount);
  }

  /**
   * Обучение автокатегоризации на правках пользователя
   */
  async learnFromCategorizationCorrection(
    description: string,
    suggestedCategory: TransactionCategory,
    correctCategory: TransactionCategory
  ) {
    return categorizationEngine.learnFromCorrection(
      description,
      suggestedCategory,
      correctCategory
    );
  }

  /**
   * Прогноз расходов на будущий период
   */
  async predictSpending(
    transactions: Transaction[],
    category: TransactionCategory,
    daysAhead: number = 30
  ): Promise<{
    predictedAmount: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendation: string;
  }> {
    if (!this.aiEnabled) {
      return {
        predictedAmount: 0,
        confidence: 0,
        trend: 'stable',
        recommendation: 'AI-прогнозы отключены',
      };
    }

    return predictionEngine.predictSpending(transactions, category, daysAhead);
  }

  /**
   * Рекомендованный буфер для бюджета
   */
  async recommendBuffer(
    budget: Budget,
    transactions: Transaction[]
  ): Promise<{
    recommendedBuffer: number;
    reason: string;
  }> {
    if (!this.aiEnabled) {
      return {
        recommendedBuffer: budget.limit * 0.1,
        reason: 'Стандартный буфер 10%',
      };
    }

    return predictionEngine.recommendBuffer(budget, transactions);
  }

  /**
   * Расчёт ETA для достижения цели
   */
  async calculateGoalETA(
    goal: Goal,
    transactions: Transaction[]
  ): Promise<{
    estimatedDate: Date;
    recommendedWeeklySaving: number;
    riskLevel: 'low' | 'medium' | 'high';
    note: string;
  }> {
    if (!this.aiEnabled) {
      const remaining = goal.targetAmount - goal.currentAmount;
      const weeklySaving = remaining / 12; // 3 месяца по умолчанию
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 90);

      return {
        estimatedDate,
        recommendedWeeklySaving: weeklySaving,
        riskLevel: 'medium',
        note: 'AI-расчёты отключены. Показан стандартный план на 3 месяца.',
      };
    }

    return predictionEngine.calculateGoalETA(goal, transactions);
  }

  /**
   * Персональные инсайты и советы
   */
  async generateInsights(
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[]
  ): Promise<AIInsight[]> {
    if (!this.aiEnabled) {
      return [];
    }

    return coachingEngine.generateInsights(transactions, budgets, goals);
  }

  /**
   * Анализ паттернов расходов
   */
  async analyzeSpendingPatterns(
    transactions: Transaction[]
  ): Promise<SpendingPattern[]> {
    if (!this.aiEnabled) {
      return [];
    }

    return coachingEngine.analyzePatterns(transactions);
  }

  /**
   * Обнаружение аномалий и потенциального фрода
   */
  async detectAnomalies(
    transactions: Transaction[]
  ): Promise<AnomalyAlert[]> {
    if (!this.aiEnabled) {
      return [];
    }

    return anomalyDetector.detect(transactions);
  }

  /**
   * Генерация персонального челленджа
   */
  async generateChallenge(
    transactions: Transaction[],
    budgets: Budget[],
    completedChallenges: Challenge[]
  ): Promise<Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'> | null> {
    if (!this.aiEnabled) {
      return null;
    }

    return challengeGenerator.generate(transactions, budgets, completedChallenges);
  }

  /**
   * Сравнение с анонимными данными (если включено)
   */
  async compareWithPeers(
    transactions: Transaction[],
    anonymousComparisonEnabled: boolean
  ): Promise<{
    percentile: number;
    message: string;
  } | null> {
    if (!this.aiEnabled || !anonymousComparisonEnabled) {
      return null;
    }

    // Здесь должна быть интеграция с бэкендом для анонимного сравнения
    // Пока возвращаем заглушку
    return {
      percentile: 50,
      message: 'Ваши расходы соответствуют средним показателям',
    };
  }
}

export const aiService = new AIService();
