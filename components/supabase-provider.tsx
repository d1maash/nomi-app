import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { supabase, createSupabaseClientWithClerkToken } from '@/lib/supabase';
import { syncAllData } from '@/services/supabase-sync';
import { useStore } from '@/store';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

interface SupabaseContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
  userId: string | null;
  supabaseClient: SupabaseClient<Database>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isInitialized: false,
  isSyncing: false,
  lastSyncTime: null,
  syncData: async () => {},
  userId: null,
  supabaseClient: supabase,
});

export const useSupabase = () => useContext(SupabaseContext);

/**
 * Провайдер для интеграции Supabase с приложением
 * Автоматически синхронизирует данные при входе пользователя
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { userId: clerkUserId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database>>(supabase);

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
      if (!clerkUserId) {
        console.log('❌ No Clerk User ID - user not logged in');
        return;
      }

      console.log('🔐 Initializing Supabase for Clerk User:', clerkUserId);

      // Временно: используем дефолтный клиент без JWT токена
      // TODO: Настроить JWT template в Clerk и раскомментировать код ниже
      let token: string | null = null;
      
      try {
        // Пытаемся получить JWT токен от Clerk (может не работать, если template не создан)
        token = await getToken({ template: 'supabase' });
        if (token) {
          console.log('✅ Clerk JWT token obtained');
          const clientWithToken = createSupabaseClientWithClerkToken(token);
          setSupabaseClient(clientWithToken);
        }
      } catch (error: any) {
        // JWT template не создан - это ок для первого запуска
        console.warn('⚠️ JWT template "supabase" not found in Clerk. Using default client.');
        console.warn('⚠️ Create JWT template in Clerk Dashboard: https://dashboard.clerk.com');
      }

      // Для проверки существования пользователя используем дефолтный клиент
      // (чтобы избежать проблем с RLS при первом входе)
      console.log('🔍 Checking if user exists in Supabase...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = not found, это норма для нового пользователя
        console.error('❌ Error checking user:', checkError);
      }

      let dbUserId = existingUser?.id;

      if (!dbUserId) {
        // Создаем нового пользователя используя дефолтный клиент
        // (это обходит RLS политики, что нужно для первого создания)
        console.log('🆕 User not found. Creating new user in Supabase...');
        console.log('📝 Clerk ID:', clerkUserId);
        
        // Получаем email и имя из Clerk
        const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || 
                         clerkUser?.emailAddresses?.[0]?.emailAddress || 
                         'user@example.com';
        
        const userName = clerkUser?.fullName || 
                        clerkUser?.firstName || 
                        clerkUser?.username || 
                        null;
        
        console.log('📧 User Email:', userEmail);
        console.log('👤 User Name:', userName);
        
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkUserId,
            email: userEmail,
            name: userName,
            currency: 'KZT',
            locale: 'ru-RU',
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating user:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        
        dbUserId = newUser.id;
        console.log('✅ User created successfully!');
        console.log('✅ User ID:', dbUserId);

        // Создаем дефолтные настройки (используем дефолтный клиент)
        await supabase.from('user_settings').insert({
          user_id: dbUserId,
        });

        // Создаем дефолтную игровую статистику (используем дефолтный клиент)
        await supabase.from('game_stats').insert({
          user_id: dbUserId,
          total_points: 0,
          level: 1,
          longest_streak: 0,
          current_streak: 0,
        });
      } else {
        console.log('✅ User already exists:', dbUserId);
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
    supabaseClient,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

