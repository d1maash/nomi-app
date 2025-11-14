import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '@/types';
import { darkTheme } from '@/styles/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/constants/categories';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{CATEGORY_ICONS[transaction.category]}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={[styles.amount, isIncome && styles.amountIncome]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.category}>
            {CATEGORY_LABELS[transaction.category]}
          </Text>
          <Text style={styles.date}>
            {formatDate(transaction.date, 'dd MMM')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: darkTheme.colors.surface,
    borderRadius: darkTheme.borderRadius.xl,
    padding: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.sm,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: darkTheme.borderRadius.lg,
    backgroundColor: darkTheme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xs,
  },
  description: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    flex: 1,
    marginRight: darkTheme.spacing.sm,
    fontWeight: '500',
  },
  amount: {
    ...darkTheme.typography.body,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  amountIncome: {
    color: darkTheme.colors.success,
  },
  category: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  date: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
  },
});
