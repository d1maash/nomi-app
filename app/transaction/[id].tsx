import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store';
import { darkTheme } from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';
import { triggerHaptic } from '@/utils/haptics';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);

  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Транзакция не найдена</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Удалить транзакцию?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          triggerHaptic.success();
          deleteTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{CATEGORY_ICONS[transaction.category]}</Text>
        <Text style={styles.category}>
          {CATEGORY_LABELS[transaction.category]}
        </Text>
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
          <Text style={styles.aiBadgeText}>
            🤖 Категория предложена AI
          </Text>
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
  icon: {
    fontSize: 64,
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
    backgroundColor: `${darkTheme.colors.primary}15`,
    padding: darkTheme.spacing.md,
    borderRadius: darkTheme.borderRadius.md,
    marginTop: darkTheme.spacing.lg,
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

