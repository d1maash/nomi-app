import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/utils/format';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';
import { startOfDay, startOfWeek, endOfWeek } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [todayInsight, setTodayInsight] = useState<string>('');

  const transactions = useStore((state) => state.transactions);
  const goals = useStore((state) => state.goals);
  const budgets = useStore((state) => state.budgets);
  const challenges = useStore((state) => state.challenges);
  const insights = useStore((state) => state.insights);

  // Вычисления
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const todayTransactions = transactions.filter(
    (t) => new Date(t.date) >= todayStart
  );

  const todayExpenses = todayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const weekExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date) >= weekStart &&
        new Date(t.date) <= weekEnd
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const activeGoal = goals.find((g) => g.currentAmount < g.targetAmount);
  const activeChallenge = challenges.find((c) => !c.completed);
  const latestInsight = insights.find((i) => !i.read);
  const recentTransactions = transactions.slice(0, 5);

  const loadInsight = useCallback(async () => {
    if (transactions.length > 0) {
      const generatedInsights = await aiService.generateInsights(transactions, budgets, goals);
      if (generatedInsights.length > 0) {
        setTodayInsight(generatedInsights[0].message);
      }
    }
  }, [transactions, budgets, goals]);

  useEffect(() => {
    loadInsight();
  }, [loadInsight]);

  const onRefresh = async () => {
    setRefreshing(true);
    triggerHaptic.light();
    await loadInsight();
    setRefreshing(false);
  };

  const handleAddTransaction = () => {
    triggerHaptic.medium();
    router.push('/add-transaction');
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="💰"
          title="Начни отслеживать траты"
          message="Добавь свою первую транзакцию, чтобы увидеть аналитику и AI-инсайты"
          actionLabel="Добавить транзакцию"
          onAction={handleAddTransaction}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={darkTheme.colors.primary} />
      }
    >
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет! 👋</Text>
        <Text style={styles.date}>{formatDate(new Date(), 'EEEE, d MMMM')}</Text>
      </View>

      {/* Сегодняшние траты */}
      <Card style={[styles.card, styles.heroCard]} variant="elevated">
        <View style={styles.heroHeader}>
          <Text style={styles.cardLabel}>Сегодня</Text>
          <Badge text={formatDate(new Date(), 'd MMM')} />
        </View>
        <Text style={styles.amount}>{formatCurrency(todayExpenses)}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>За неделю</Text>
            <Text style={styles.heroStatValue}>
              {formatCurrency(weekExpenses)}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Транзакций</Text>
            <Text style={styles.heroStatValue}>
              {todayTransactions.length}
            </Text>
          </View>
        </View>
      </Card>

      {/* Активная цель */}
      {activeGoal && (
        <Card style={styles.card} variant="elevated">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎯 {activeGoal.name}</Text>
            <Badge
              text={`${Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100)}%`}
              variant="success"
            />
          </View>
          <ProgressBar
            progress={(activeGoal.currentAmount / activeGoal.targetAmount) * 100}
            style={styles.progress}
          />
          <Text style={styles.cardSubtext}>
            {formatCurrency(activeGoal.currentAmount)} из {formatCurrency(activeGoal.targetAmount)}
          </Text>
        </Card>
      )}

      {/* Активный челлендж */}
      {activeChallenge && (
        <Card
          style={styles.card}
          variant="tinted"
          onPress={() => router.push('/(tabs)/insights')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>⚡ {activeChallenge.title}</Text>
            <Badge text={`${activeChallenge.streak} дн.`} variant="warning" />
          </View>
          <Text style={styles.cardSubtext}>{activeChallenge.description}</Text>
          <ProgressBar progress={activeChallenge.progress} style={styles.progress} />
        </Card>
      )}

      {/* AI-инсайт */}
      {(todayInsight || latestInsight) && (
        <Card style={styles.card} variant="tinted">
          <Text style={styles.insightTitle}>💡 AI-совет</Text>
          <Text style={styles.insightText}>
            {todayInsight || latestInsight?.message}
          </Text>
        </Card>
      )}

      {/* Быстрые действия */}
      <View style={styles.actions}>
        <Button
          title="+ Добавить транзакцию"
          onPress={handleAddTransaction}
          variant="primary"
          size="large"
        />
      </View>

      {/* Последние транзакции */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Последние транзакции</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.sectionLink}>Все →</Text>
          </TouchableOpacity>
        </View>
        
        {recentTransactions.map((transaction) => (
          <Card
            key={transaction.id}
            style={styles.transactionCard}
            onPress={() => router.push(`/transaction/${transaction.id}`)}
          >
            <View style={styles.transactionRow}>
              <View>
                <Text style={styles.transactionDesc}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date, 'dd MMM')}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === 'income' && styles.transactionAmountIncome,
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    padding: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  header: {
    marginBottom: darkTheme.spacing.xl,
  },
  greeting: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  date: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  card: {
    marginBottom: darkTheme.spacing.lg,
  },
  heroCard: {
    paddingVertical: darkTheme.spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  cardLabel: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  amount: {
    ...darkTheme.typography.h1,
    fontSize: 44,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.cardBorder,
    paddingTop: darkTheme.spacing.md,
    marginTop: darkTheme.spacing.md,
    gap: darkTheme.spacing.lg,
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
    marginBottom: 4,
  },
  heroStatValue: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
  },
  cardSubtext: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  cardTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    flex: 1,
  },
  progress: {
    marginVertical: darkTheme.spacing.sm,
  },
  insightTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  insightText: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    marginVertical: darkTheme.spacing.lg,
  },
  section: {
    marginTop: darkTheme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  sectionTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
  },
  sectionLink: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  transactionCard: {
    marginBottom: darkTheme.spacing.sm,
    padding: darkTheme.spacing.lg,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDesc: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  transactionDate: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  transactionAmount: {
    ...darkTheme.typography.body,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  transactionAmountIncome: {
    color: darkTheme.colors.success,
  },
});
