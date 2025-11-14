// Типы данных приложения

export interface User {
  id: string;
  email: string;
  name?: string;
  currency: string;
  locale: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: Date;
  type: 'expense' | 'income';
  aiSuggested?: boolean;
  recurring?: RecurringPattern;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'gifts'
  | 'coffee'
  | 'subscriptions'
  | 'income'
  | 'other';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Date;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  aiPrediction?: {
    predictedSpend: number;
    confidence: number;
    recommendation: string;
  };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  aiETA?: {
    estimatedDate: Date;
    recommendedWeeklySaving: number;
    riskLevel: 'low' | 'medium' | 'high';
    note: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsight {
  id: string;
  type: 'coaching' | 'anomaly' | 'prediction' | 'comparison';
  title: string;
  message: string;
  actionable: string;
  priority: 'low' | 'medium' | 'high';
  category?: TransactionCategory;
  date: Date;
  read: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'spending' | 'saving' | 'category';
  targetCategory?: TransactionCategory;
  targetAmount?: number;
  duration: number; // дни
  startDate: Date;
  endDate: Date;
  progress: number;
  streak: number;
  completed: boolean;
  badge?: Badge;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: TransactionCategory | 'general';
  earnedAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  monthlyBudget: boolean;
  goalProgress: boolean;
  challenges: boolean;
  insights: boolean;
  recurringReminders: boolean;
}

export interface PrivacySettings {
  aiCategorization: boolean;
  aiPredictions: boolean;
  aiCoaching: boolean;
  anonymousComparison: boolean;
  dataExportEnabled: boolean;
}

export interface AppSettings {
  currency: string;
  locale: string;
  theme: 'dark' | 'light';
  biometricLockEnabled: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface SpendingPattern {
  category: TransactionCategory;
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalFactors?: {
    month: number;
    multiplier: number;
  }[];
}

export interface AnomalyAlert {
  id: string;
  transactionId: string;
  type: 'unusual_amount' | 'duplicate' | 'unusual_location' | 'unusual_time';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  date: Date;
  dismissed: boolean;
}

export interface GameStats {
  totalPoints: number;
  level: number;
  badges: Badge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  longestStreak: number;
  currentStreak: number;
}

