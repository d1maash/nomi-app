import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { syncAllData } from '@/services/supabase-sync';
import { useStore } from '@/store';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/types/database';

interface SupabaseContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
  userId: string | null;
  supabaseClient: SupabaseClient<Database>;
  user: User | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isInitialized: false,
  isSyncing: false,
  lastSyncTime: null,
  syncData: async () => {},
  userId: null,
  supabaseClient: supabase,
  user: null,
});

export const useSupabase = () => useContext(SupabaseContext);

/**
 * Провайдер для интеграции Supabase с приложением
 * Автоматически синхронизирует данные при входе пользователя
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Store actions
  const store = useStore();

  // Инициализация при входе пользователя
  useEffect(() => {
    let mounted = true;

    // Получаем текущего пользователя
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        initializeSupabase(session.user.id);
      } else {
        setIsInitialized(true); // Даже без пользователя считаем инициализированным
      }
    });

    // Подписываемся на изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
          await initializeSupabase(session.user.id);
        } else {
          setUser(null);
          setUserId(null);
          setIsInitialized(false);
          // Очищаем store при выходе
          store.transactions = [];
          store.budgets = [];
          store.goals = [];
          store.insights = [];
          store.challenges = [];
          store.badges = [];
          store.anomalyAlerts = [];
          store.gameStats = null;
          store.settings = null;
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function initializeSupabase(authUserId: string) {
    try {
      console.log('🔐 Initializing Supabase for User:', authUserId);

      setUserId(authUserId);
      setIsInitialized(true);

      // Автоматическая синхронизация при входе
      await syncData(authUserId);
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
      console.log('[sync] Data synced successfully');
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
    supabaseClient: supabase,
    user,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
