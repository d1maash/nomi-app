import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase';
import { useSupabase as useSupabaseContext } from '@/components/supabase-provider';
import {
  getUserId,
  upsertUser,
  getTransactions,
  getBudgets,
  getGoals,
  getInsights,
  getChallenges,
  getBadges,
  getAnomalyAlerts,
  getGameStats,
  getUserSettings,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createBudget,
  updateBudget,
  deleteBudget,
  createGoal,
  updateGoal,
  deleteGoal,
  createInsight,
  markInsightAsRead,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  awardBadge,
  createAnomalyAlert,
  dismissAnomalyAlert,
  updateGameStats,
  updateUserSettings,
  syncAllData,
} from '@/services/supabase-sync';
import { Transaction, Budget, Goal, AIInsight, Challenge, Badge, AnomalyAlert, AppSettings } from '@/types';

/**
 * Хук для работы с данными пользователя в Supabase
 */
export function useSupabaseData() {
  const { userId: clerkUserId } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Инициализация пользователя и получение user_id
  useEffect(() => {
    async function initUser() {
      if (!clerkUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Получаем или создаем пользователя в Supabase
        let dbUserId = await getUserId(clerkUserId);
        
        if (!dbUserId) {
          // Если пользователя нет, создаем его
          const newUser = await upsertUser(
            clerkUserId,
            'user@example.com', // TODO: получить email из Clerk
            undefined
          );
          dbUserId = newUser.id;
        }

        setUserId(dbUserId);
      } catch (err) {
        console.error('Error initializing user:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    initUser();
  }, [clerkUserId]);

  return {
    userId,
    isLoading,
    error,
  };
}

/**
 * Хук для работы с транзакциями
 */
export function useTransactions() {
  const { userId } = useSupabaseData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadTransactions();
      subscribeToTransactions();
    }
  }, [userId]);

  async function loadTransactions() {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await getTransactions(userId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToTransactions() {
    if (!userId) return;

    const subscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function add(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('User not authenticated');
    await createTransaction(userId, transaction);
  }

  async function update(id: string, updates: Partial<Transaction>) {
    await updateTransaction(id, updates);
  }

  async function remove(id: string) {
    await deleteTransaction(id);
  }

  return {
    transactions,
    isLoading,
    add,
    update,
    remove,
    refresh: loadTransactions,
  };
}

/**
 * Хук для работы с бюджетами
 */
export function useBudgets() {
  const { userId } = useSupabaseData();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadBudgets();
      subscribeToBudgets();
    }
  }, [userId]);

  async function loadBudgets() {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await getBudgets(userId);
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToBudgets() {
    if (!userId) return;

    const subscription = supabase
      .channel('budgets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadBudgets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function add(budget: Omit<Budget, 'id' | 'spent'>) {
    if (!userId) throw new Error('User not authenticated');
    await createBudget(userId, budget);
  }

  async function update(id: string, updates: Partial<Budget>) {
    await updateBudget(id, updates);
  }

  async function remove(id: string) {
    await deleteBudget(id);
  }

  return {
    budgets,
    isLoading,
    add,
    update,
    remove,
    refresh: loadBudgets,
  };
}

/**
 * Хук для работы с целями
 */
export function useGoals() {
  const { userId } = useSupabaseData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadGoals();
      subscribeToGoals();
    }
  }, [userId]);

  async function loadGoals() {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await getGoals(userId);
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToGoals() {
    if (!userId) return;

    const subscription = supabase
      .channel('goals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadGoals();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function add(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('User not authenticated');
    await createGoal(userId, goal);
  }

  async function update(id: string, updates: Partial<Goal>) {
    await updateGoal(id, updates);
  }

  async function remove(id: string) {
    await deleteGoal(id);
  }

  return {
    goals,
    isLoading,
    add,
    update,
    remove,
    refresh: loadGoals,
  };
}

/**
 * Хук для работы с AI инсайтами
 */
export function useInsights() {
  const { userId } = useSupabaseData();
  const { supabaseClient } = useSupabaseContext();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadInsights();
      subscribeToInsights();
    }
  }, [userId]);

  async function loadInsights() {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await getInsights(userId);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToInsights() {
    if (!userId) return;

    const subscription = supabase
      .channel('ai_insights')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_insights',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadInsights();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function add(insight: Omit<AIInsight, 'id'>) {
    if (!userId) throw new Error('User not authenticated');
    
    const { data, error } = await supabaseClient
      .from('ai_insights')
      .insert({
        user_id: userId,
        type: insight.type,
        title: insight.title,
        message: insight.message,
        actionable: insight.actionable,
        priority: insight.priority,
        category: insight.category,
        date: insight.date.toISOString(),
        read: insight.read ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating insight:', error);
      throw error;
    }

    return data;
  }

  async function markAsRead(id: string) {
    const { error } = await supabaseClient
      .from('ai_insights')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking insight as read:', error);
      throw error;
    }
  }

  return {
    insights,
    isLoading,
    add,
    markAsRead,
    refresh: loadInsights,
  };
}

/**
 * Хук для работы с челленджами
 */
export function useChallenges() {
  const { userId } = useSupabaseData();
  const { supabaseClient } = useSupabaseContext();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadChallenges();
      subscribeToChallenges();
    }
  }, [userId]);

  async function loadChallenges() {
    if (!userId) return;
    
    console.log('🔵 [useChallenges] Loading challenges for userId:', userId);
    setIsLoading(true);
    try {
      const data = await getChallenges(userId);
      console.log('🔵 [useChallenges] Loaded challenges:', data.length, 'challenges');
      if (data.length > 0) {
        console.log('🔵 [useChallenges] First challenge:', JSON.stringify(data[0], null, 2));
      }
      setChallenges(data);
    } catch (error) {
      console.error('❌ [useChallenges] Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToChallenges() {
    if (!userId) return;

    const subscription = supabase
      .channel('challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadChallenges();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function add(challenge: Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'>) {
    if (!userId) throw new Error('User not authenticated');
    
    console.log('🔵 [useChallenges] Creating challenge with userId:', userId);
    console.log('🔵 [useChallenges] supabaseClient:', supabaseClient === supabase ? 'DEFAULT (no JWT)' : 'WITH JWT');
    
    // Используем supabaseClient с JWT вместо глобального supabase
    const { data, error } = await supabaseClient
      .from('challenges')
      .insert({
        user_id: userId,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        target_category: challenge.targetCategory,
        target_amount: challenge.targetAmount,
        duration: challenge.duration,
        start_date: challenge.startDate.toISOString(),
        end_date: challenge.endDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [useChallenges] Error creating challenge:', error);
      throw error;
    }

    console.log('✅ [useChallenges] Challenge created successfully');
    
    // Перезагружаем список челленджей
    await loadChallenges();
    
    return data;
  }

  async function update(id: string, updates: Partial<Challenge>) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.streak !== undefined) updateData.streak = updates.streak;
    if (updates.completed !== undefined) updateData.completed = updates.completed;

    const { error } = await supabaseClient
      .from('challenges')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  async function remove(id: string) {
    const { error } = await supabaseClient
      .from('challenges')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }

  return {
    challenges,
    isLoading,
    add,
    update,
    remove,
    refresh: loadChallenges,
  };
}

/**
 * Хук для работы с настройками пользователя
 */
export function useSettings() {
  const { userId, isLoading: isUserLoading } = useSupabaseData();
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'KZT',
    locale: 'ru-RU',
    theme: 'dark',
    biometricLockEnabled: false,
    hasCompletedOnboarding: true,
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
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const data = await getUserSettings(userId);
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const update = useCallback(
    async (updates: Partial<AppSettings>) => {
      if (!userId) return;

      try {
        await updateUserSettings(userId, updates);
        setSettings((prev) => ({ ...prev, ...updates }));
      } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
    },
    [userId]
  );

  return {
    settings,
    isLoading: isLoading || isUserLoading,
    update,
    refresh: loadSettings,
  };
}

/**
 * Универсальный хук для синхронизации всех данных
 */
export function useSupabaseSync() {
  const { userId, isLoading: isUserLoading } = useSupabaseData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  async function sync() {
    if (!userId) return;

    setIsSyncing(true);
    try {
      const data = await syncAllData(userId);
      setLastSyncTime(new Date());
      return data;
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  return {
    sync,
    isSyncing,
    isUserLoading,
    lastSyncTime,
  };
}

