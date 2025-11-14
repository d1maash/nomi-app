import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase';
import { syncAllData } from '@/services/supabase-sync';
import { useStore } from '@/store';

interface SupabaseContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
  userId: string | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isInitialized: false,
  isSyncing: false,
  lastSyncTime: null,
  syncData: async () => {},
  userId: null,
});

export const useSupabase = () => useContext(SupabaseContext);

/**
 * Провайдер для интеграции Supabase с приложением
 * Автоматически синхронизирует данные при входе пользователя
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { userId: clerkUserId } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Store actions
  const store = useStore();

  // Инициализация при входе пользователя
  useEffect(() => {
    if (clerkUserId) {
      initializeSupabase();
    } else {
      setIsInitialized(false);
      setUserId(null);
    }
  }, [clerkUserId]);

  async function initializeSupabase() {
    try {
      if (!clerkUserId) return;

      // Получаем или создаем пользователя в Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      let dbUserId = existingUser?.id;

      if (!dbUserId) {
        // Создаем нового пользователя
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkUserId,
            email: 'user@example.com', // TODO: получить из Clerk
            currency: 'KZT',
            locale: 'ru-RU',
          })
          .select()
          .single();

        if (error) throw error;
        dbUserId = newUser.id;

        // Создаем дефолтные настройки
        await supabase.from('user_settings').insert({
          user_id: dbUserId,
        });

        // Создаем дефолтную игровую статистику
        await supabase.from('game_stats').insert({
          user_id: dbUserId,
          total_points: 0,
          level: 1,
          longest_streak: 0,
          current_streak: 0,
        });
      }

      setUserId(dbUserId);
      setIsInitialized(true);

      // Автоматическая синхронизация при входе
      await syncData(dbUserId);
    } catch (error) {
      console.error('Error initializing Supabase:', error);
      setIsInitialized(false);
    }
  }

  async function syncData(targetUserId?: string) {
    const userIdToSync = targetUserId || userId;
    if (!userIdToSync) {
      console.warn('Cannot sync: user ID not available');
      return;
    }

    setIsSyncing(true);
    try {
      const data = await syncAllData(userIdToSync);

      // Обновляем store с данными из Supabase
      if (data.transactions) {
        store.transactions = data.transactions;
      }
      if (data.budgets) {
        store.budgets = data.budgets;
      }
      if (data.goals) {
        store.goals = data.goals;
      }
      if (data.insights) {
        store.insights = data.insights;
      }
      if (data.challenges) {
        store.challenges = data.challenges;
      }
      if (data.badges) {
        store.badges = data.badges;
      }
      if (data.anomalyAlerts) {
        store.anomalyAlerts = data.anomalyAlerts;
      }
      if (data.gameStats) {
        store.gameStats = data.gameStats;
      }
      if (data.settings) {
        store.settings = data.settings;
      }

      setLastSyncTime(new Date());
      console.log('✅ Data synced successfully');
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  const value: SupabaseContextType = {
    isInitialized,
    isSyncing,
    lastSyncTime,
    syncData: () => syncData(),
    userId,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

