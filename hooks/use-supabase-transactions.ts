/**
 * Упрощенный хук для работы с транзакциями через Supabase
 * Можно использовать вместо локального store
 */
import { useEffect } from 'react';
import { useSupabase } from '@/components/supabase-provider';
import { useTransactions } from './use-supabase';
import { useStore } from '@/store';

/**
 * Хук, который синхронизирует транзакции из Supabase с локальным store
 */
export function useSupabaseTransactions() {
  const { isInitialized } = useSupabase();
  const { transactions, isLoading, add, update, remove } = useTransactions();
  const store = useStore();

  // Синхронизируем данные со store
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      store.transactions = transactions;
    }
  }, [transactions, isLoading]);

  return {
    transactions: store.transactions,
    isLoading,
    isInitialized,
    addTransaction: add,
    updateTransaction: update,
    deleteTransaction: remove,
  };
}

