import { create } from 'zustand';
import {
  Transaction,
  Budget,
  Goal,
  AIInsight,
  Challenge,
  Badge,
  AppSettings,
  GameStats,
  AnomalyAlert,
} from '@/types';
import { storageUtils, storageKeys } from '@/lib/storage';

interface AppState {
  // Данные
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  insights: AIInsight[];
  challenges: Challenge[];
  badges: Badge[];
  anomalyAlerts: AnomalyAlert[];
  gameStats: GameStats;
  settings: AppSettings;

  // Состояния UI
  isLoading: boolean;
  onboardingCompleted: boolean;

  // Действия - Транзакции
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Действия - Бюджеты
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Действия - Цели
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Действия - Инсайты
  addInsight: (insight: Omit<AIInsight, 'id'>) => void;
  markInsightAsRead: (id: string) => void;
  dismissAnomalyAlert: (id: string) => void;

  // Действия - Челленджи
  addChallenge: (challenge: Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'>) => void;
  updateChallengeProgress: (id: string, progress: number) => void;
  completeChallenge: (id: string) => void;

  // Действия - Настройки
  updateSettings: (updates: Partial<AppSettings>) => void;
  completeOnboarding: () => void;

  // Действия - Геймификация
  awardBadge: (badge: Badge) => void;
  updateGameStats: (updates: Partial<GameStats>) => void;

  // Загрузка и сохранение
  loadFromStorage: () => void;
  saveToStorage: () => void;
  resetAppState: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  currency: 'KZT',
  locale: 'ru-RU',
  theme: 'dark',
  biometricLockEnabled: false,
  notifications: {
    enabled: true,
    monthlyBudget: true,
    goalProgress: true,
    challenges: true,
    insights: true,
    recurringReminders: true,
  },
  privacy: {
    aiCategorization: true,
    aiPredictions: true,
    aiCoaching: true,
    anonymousComparison: false,
    dataExportEnabled: true,
  },
};

const defaultGameStats: GameStats = {
  totalPoints: 0,
  level: 1,
  badges: [],
  activeChallenges: [],
  completedChallenges: [],
  longestStreak: 0,
  currentStreak: 0,
};

export const useStore = create<AppState>((set, get) => ({
  // Начальное состояние
  transactions: [],
  budgets: [],
  goals: [],
  insights: [],
  challenges: [],
  badges: [],
  anomalyAlerts: [],
  gameStats: defaultGameStats,
  settings: defaultSettings,
  isLoading: false,
  onboardingCompleted: false,

  // Транзакции
  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
    get().saveToStorage();
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }));
    get().saveToStorage();
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().saveToStorage();
  },

  // Бюджеты
  addBudget: (budget) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
    };
    set((state) => ({
      budgets: [...state.budgets, newBudget],
    }));
    get().saveToStorage();
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    get().saveToStorage();
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    get().saveToStorage();
  },

  // Цели
  addGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      goals: [...state.goals, newGoal],
    }));
    get().saveToStorage();
  },

  updateGoal: (id, updates) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g
      ),
    }));
    get().saveToStorage();
  },

  deleteGoal: (id) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
    get().saveToStorage();
  },

  // Инсайты
  addInsight: (insight) => {
    const newInsight: AIInsight = {
      ...insight,
      id: Date.now().toString(),
    };
    set((state) => ({
      insights: [newInsight, ...state.insights],
    }));
    get().saveToStorage();
  },

  markInsightAsRead: (id) => {
    set((state) => ({
      insights: state.insights.map((i) => (i.id === id ? { ...i, read: true } : i)),
    }));
    get().saveToStorage();
  },

  dismissAnomalyAlert: (id) => {
    set((state) => ({
      anomalyAlerts: state.anomalyAlerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    }));
    get().saveToStorage();
  },

  // Челленджи
  addChallenge: (challenge) => {
    const newChallenge: Challenge = {
      ...challenge,
      id: Date.now().toString(),
      progress: 0,
      streak: 0,
      completed: false,
    };
    set((state) => ({
      challenges: [...state.challenges, newChallenge],
    }));
    get().saveToStorage();
  },

  updateChallengeProgress: (id, progress) => {
    set((state) => ({
      challenges: state.challenges.map((c) => (c.id === id ? { ...c, progress } : c)),
    }));
    get().saveToStorage();
  },

  completeChallenge: (id) => {
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, completed: true } : c
      ),
    }));
    get().saveToStorage();
  },

  // Настройки
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    get().saveToStorage();
  },

  completeOnboarding: () => {
    set({ onboardingCompleted: true });
    storageUtils.set(storageKeys.ONBOARDING_COMPLETED, true).catch(console.error);
  },

  // Геймификация
  awardBadge: (badge) => {
    set((state) => ({
      badges: [...state.badges, { ...badge, earnedAt: new Date() }],
      gameStats: {
        ...state.gameStats,
        badges: [...state.gameStats.badges, { ...badge, earnedAt: new Date() }],
      },
    }));
    get().saveToStorage();
  },

  updateGameStats: (updates) => {
    set((state) => ({
      gameStats: { ...state.gameStats, ...updates },
    }));
    get().saveToStorage();
  },

  // Загрузка и сохранение
  loadFromStorage: async () => {
    try {
      const [
        transactions,
        budgets,
        goals,
        insights,
        challenges,
        badges,
        settings,
        gameStats,
        onboardingCompleted,
      ] = await Promise.all([
        storageUtils.get<Transaction[]>(storageKeys.TRANSACTIONS),
        storageUtils.get<Budget[]>(storageKeys.BUDGETS),
        storageUtils.get<Goal[]>(storageKeys.GOALS),
        storageUtils.get<AIInsight[]>(storageKeys.INSIGHTS),
        storageUtils.get<Challenge[]>(storageKeys.CHALLENGES),
        storageUtils.get<Badge[]>(storageKeys.BADGES),
        storageUtils.get<AppSettings>(storageKeys.SETTINGS),
        storageUtils.get<GameStats>(storageKeys.GAME_STATS),
        storageUtils.get<boolean>(storageKeys.ONBOARDING_COMPLETED),
      ]);

      set({
        transactions: transactions || [],
        budgets: budgets || [],
        goals: goals || [],
        insights: insights || [],
        challenges: challenges || [],
        badges: badges || [],
        settings: settings || defaultSettings,
        gameStats: gameStats || defaultGameStats,
        onboardingCompleted: onboardingCompleted || false,
      });
    } catch (error) {
      console.error('Load from storage error:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await Promise.all([
        storageUtils.set(storageKeys.TRANSACTIONS, state.transactions),
        storageUtils.set(storageKeys.BUDGETS, state.budgets),
        storageUtils.set(storageKeys.GOALS, state.goals),
        storageUtils.set(storageKeys.INSIGHTS, state.insights),
        storageUtils.set(storageKeys.CHALLENGES, state.challenges),
        storageUtils.set(storageKeys.BADGES, state.badges),
        storageUtils.set(storageKeys.SETTINGS, state.settings),
        storageUtils.set(storageKeys.GAME_STATS, state.gameStats),
      ]);
    } catch (error) {
      console.error('Save to storage error:', error);
    }
  },

  resetAppState: async () => {
    const keepOnboardingCompleted = get().onboardingCompleted;

    set({
      transactions: [],
      budgets: [],
      goals: [],
      insights: [],
      challenges: [],
      badges: [],
      anomalyAlerts: [],
      gameStats: defaultGameStats,
      settings: defaultSettings,
      isLoading: false,
      onboardingCompleted: keepOnboardingCompleted,
    });

    try {
      const keysToClear = [
        storageKeys.USER,
        storageKeys.TRANSACTIONS,
        storageKeys.BUDGETS,
        storageKeys.GOALS,
        storageKeys.INSIGHTS,
        storageKeys.CHALLENGES,
        storageKeys.BADGES,
        storageKeys.SETTINGS,
        storageKeys.GAME_STATS,
        storageKeys.BIOMETRIC_ENABLED,
        storageKeys.LAST_SYNC,
        storageKeys.CATEGORY_CORRECTIONS,
      ];
      await Promise.all(keysToClear.map((key) => storageUtils.delete(key)));
    } catch (error) {
      console.error('Reset store error:', error);
    }
  },
}));
