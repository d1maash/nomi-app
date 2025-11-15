import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';
import { AIInsight, Challenge } from '@/types';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useTransactions, useBudgets, useGoals, useChallenges, useInsights } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';

export default function InsightsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<AIInsight[]>([]);
  const [suggestedChallenge, setSuggestedChallenge] = useState<Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'> | null>(null);

  // Загружаем данные из Supabase
  const { transactions, isLoading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const { budgets, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { goals, isLoading: goalsLoading, refresh: refreshGoals } = useGoals();
  const { challenges, add: addChallenge, isLoading: challengesLoading, refresh: refreshChallenges } = useChallenges();
  const { insights, markAsRead: markInsightAsRead } = useInsights();
  const { isInitialized } = useSupabase();

  const loadInsights = useCallback(async () => {
    const generated = await aiService.generateInsights(transactions, budgets, goals);
    setGeneratedInsights(generated);

    // Генерируем челлендж
    const challenge = await aiService.generateChallenge(
      transactions,
      budgets,
      challenges.filter((c) => c.completed)
    );
    setSuggestedChallenge(challenge);
  }, [transactions, budgets, goals, challenges]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const onRefresh = async () => {
    setRefreshing(true);
    triggerHaptic.light();
    try {
      // Сначала обновляем данные из Supabase
      await Promise.all([
        refreshTransactions(),
        refreshBudgets(),
        refreshGoals(),
        refreshChallenges(),
      ]);
      // Затем регенерируем инсайты на основе свежих данных
      await loadInsights();
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptChallenge = async () => {
    if (suggestedChallenge && isInitialized) {
      triggerHaptic.success();
      await addChallenge(suggestedChallenge);
      setSuggestedChallenge(null);
    }
  };

  const handleInsightPress = async (insight: AIInsight) => {
    if (isInitialized) {
      await markInsightAsRead(insight.id);
    }
  };

  const activeChallenges = challenges.filter((c) => !c.completed);
  const completedChallenges = challenges.filter((c) => c.completed);

  console.log('🔵 [Insights] Total challenges:', challenges.length);
  console.log('🔵 [Insights] Active challenges:', activeChallenges.length);
  console.log('🔵 [Insights] Completed challenges:', completedChallenges.length);

  // Показываем индикатор загрузки только при первой загрузке
  const isInitialLoading = (transactionsLoading || budgetsLoading || goalsLoading || challengesLoading) && 
    transactions.length === 0 && budgets.length === 0 && goals.length === 0 && challenges.length === 0;

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={darkTheme.colors.accent} />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkTheme.colors.accent}
            colors={[darkTheme.colors.accent]}
            progressBackgroundColor={darkTheme.colors.surface}
            title="Обновление..."
            titleColor={darkTheme.colors.textSecondary}
          />
        }
      >
        <EmptyState
          iconName="clipboard"
          title="Недостаточно данных"
          message="Добавь несколько транзакций, чтобы получить AI-инсайты и рекомендации"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={darkTheme.colors.accent}
          colors={[darkTheme.colors.accent]}
          progressBackgroundColor={darkTheme.colors.surface}
          title="Обновление..."
          titleColor={darkTheme.colors.textSecondary}
        />
      }
    >
      <Text style={styles.title}>AI-Инсайты</Text>

      {/* Предложенный челлендж */}
      {suggestedChallenge && (
        <Card style={[styles.card, styles.challengeCard]}>
          <View style={styles.cardTitleRow}>
            <MonoIcon name='activity' size={18} color={darkTheme.colors.text} />
            <Text style={styles.cardTitle}>Новый челлендж для тебя</Text>
          </View>
          <Text style={styles.challengeTitle}>{suggestedChallenge.title}</Text>
          <Text style={styles.challengeDesc}>{suggestedChallenge.description}</Text>
          <View style={styles.challengeMeta}>
            <Badge text={`${suggestedChallenge.duration} дней`} variant="warning" />
            {suggestedChallenge.badge && (
              <View style={styles.challengeBadgeRow}>
                <MonoIcon name={suggestedChallenge.badge.icon} size={16} color={darkTheme.colors.textSecondary} />
                <Text style={styles.challengeBadge}>
                  Награда: {suggestedChallenge.badge.name}
                </Text>
              </View>
            )}
          </View>
          <Button
            title="Принять челлендж"
            onPress={handleAcceptChallenge}
            variant="primary"
            style={styles.acceptButton}
          />
        </Card>
      )}

      {/* Активные челленджи */}
      {activeChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Активные челленджи</Text>
          {activeChallenges.map((challenge) => (
            <Card key={challenge.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{challenge.title}</Text>
                <Badge text={`${challenge.streak} дн.`} variant="warning" />
              </View>
              <Text style={styles.cardSubtext}>{challenge.description}</Text>
              <ProgressBar progress={challenge.progress} style={styles.progress} />
              <Text style={styles.challengeProgress}>
                Прогресс: {Math.round(challenge.progress)}%
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Инсайты */}
      {generatedInsights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Персональные инсайты</Text>
          {generatedInsights.map((insight) => (
            <Card
              key={insight.id}
              style={styles.card}
              onPress={() => handleInsightPress(insight)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Badge
                  text={
                    insight.priority === 'high'
                      ? 'Важно'
                      : insight.priority === 'medium'
                      ? 'Средне'
                      : 'Инфо'
                  }
                  variant={
                    insight.priority === 'high'
                      ? 'error'
                      : insight.priority === 'medium'
                      ? 'warning'
                      : 'default'
                  }
                />
              </View>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              <View style={styles.actionableContainer}>
                <View style={styles.actionableLabelRow}>
                  <MonoIcon name="bookmark" size={14} color={darkTheme.colors.text} />
                  <Text style={styles.actionableLabel}>Совет</Text>
                </View>
                <Text style={styles.actionableText}>{insight.actionable}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Завершённые челленджи */}
      {completedChallenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Завершённые челленджи</Text>
            <MonoIcon name="award" size={18} color={darkTheme.colors.textSecondary} />
          </View>
          {completedChallenges.slice(0, 3).map((challenge) => (
            <Card key={challenge.id} style={styles.card}>
              <View style={styles.completedRow}>
                <MonoIcon name="check-circle" size={16} color={darkTheme.colors.textSecondary} />
                <Text style={styles.completedTitle}>
                  {challenge.title}
                </Text>
              </View>
              {challenge.badge && (
                <View style={styles.badgeEarnedRow}>
                  <MonoIcon name={challenge.badge.icon} size={14} color={darkTheme.colors.textSecondary} />
                  <Text style={styles.badgeEarned}>
                    {challenge.badge.name}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: darkTheme.spacing.md,
  },
  loadingText: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    marginTop: darkTheme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  content: {
    padding: darkTheme.spacing.lg,
  },
  title: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xl,
  },
  section: {
    marginTop: darkTheme.spacing.lg,
  },
  sectionTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.md,
  },
  card: {
    marginBottom: darkTheme.spacing.md,
  },
  challengeCard: {
    backgroundColor: `${darkTheme.colors.warning}15`,
    borderWidth: 1,
    borderColor: `${darkTheme.colors.warning}30`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
  },
  cardTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
    flex: 1,
  },
  cardSubtext: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.sm,
  },
  challengeTitle: {
    ...darkTheme.typography.h2,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  challengeDesc: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.md,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.md,
  },
  challengeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
  },
  challengeBadge: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  acceptButton: {
    marginTop: darkTheme.spacing.sm,
  },
  progress: {
    marginVertical: darkTheme.spacing.sm,
  },
  challengeProgress: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  insightTitle: {
    ...darkTheme.typography.body,
    fontWeight: '600',
    color: darkTheme.colors.text,
    flex: 1,
  },
  insightMessage: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.sm,
  },
  actionableContainer: {
    backgroundColor: `${darkTheme.colors.primary}10`,
    padding: darkTheme.spacing.md,
    borderRadius: darkTheme.borderRadius.sm,
    marginTop: darkTheme.spacing.sm,
  },
  actionableLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.xs,
  },
  actionableLabel: {
    ...darkTheme.typography.bodySmall,
    fontWeight: '600',
    color: darkTheme.colors.primary,
  },
  actionableText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.text,
  },
  completedTitle: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.xs,
  },
  badgeEarned: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.success,
  },
  badgeEarnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
});
