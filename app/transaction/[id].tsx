import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { darkTheme } from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';
import { triggerHaptic } from '@/utils/haptics';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useTransactions } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { transactions, remove: deleteTransaction } = useTransactions();
  const { isInitialized } = useSupabase();

  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Транзакция не найдена</Text>
      </View>
    );
  }

  const handleDelete = () => {
    if (!isInitialized) return;
    
    Alert.alert('Удалить транзакцию?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic.success();
          await deleteTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${CATEGORY_COLORS[transaction.category]}22`,
              borderColor: `${CATEGORY_COLORS[transaction.category]}55`,
            },
          ]}
        >
          <MonoIcon name={CATEGORY_ICONS[transaction.category]} size={32} />
        </View>
        <Text style={styles.category}>{CATEGORY_LABELS[transaction.category]}</Text>
      </View>

      <Text style={styles.amount}>
        {transaction.type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>

      <Text style={styles.description}>{transaction.description}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Дата</Text>
        <Text style={styles.metaValue}>
          {formatDate(transaction.date, 'dd MMMM yyyy, HH:mm')}
        </Text>
      </View>

      {transaction.aiSuggested && (
        <View style={styles.aiBadge}>
          <MonoIcon name="cpu" size={14} color={darkTheme.colors.text} />
          <Text style={styles.aiBadgeText}>Категория предложена AI</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Удалить"
          onPress={handleDelete}
          variant="secondary"
          size="large"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    padding: darkTheme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xl,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: darkTheme.borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  category: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  amount: {
    ...darkTheme.typography.h1,
    fontSize: 48,
    color: darkTheme.colors.text,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.lg,
  },
  description: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.xl,
  },
  meta: {
    marginBottom: darkTheme.spacing.md,
  },
  metaLabel: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.xs,
  },
  metaValue: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
  },
  aiBadge: {
    backgroundColor: `${darkTheme.colors.primary}10`,
    padding: darkTheme.spacing.md,
    borderRadius: darkTheme.borderRadius.md,
    marginTop: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkTheme.spacing.xs,
  },
  aiBadgeText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.primary,
    textAlign: 'center',
  },
  actions: {
    marginTop: 'auto',
    paddingTop: darkTheme.spacing.xl,
  },
  error: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.error,
    textAlign: 'center',
  },
});

