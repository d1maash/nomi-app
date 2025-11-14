import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useStore } from '@/store';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';
import { AIInsight, Challenge } from '@/types';

export default function InsightsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<AIInsight[]>([]);
  const [suggestedChallenge, setSuggestedChallenge] = useState<Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'> | null>(null);

  const transactions = useStore((state) => state.transactions);
  const budgets = useStore((state) => state.budgets);
  const goals = useStore((state) => state.goals);
  const challenges = useStore((state) => state.challenges);
  const addChallenge = useStore((state) => state.addChallenge);
  const markInsightAsRead = useStore((state) => state.markInsightAsRead);

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
    await loadInsights();
    setRefreshing(false);
  };

  const handleAcceptChallenge = () => {
    if (suggestedChallenge) {
      triggerHaptic.success();
      addChallenge(suggestedChallenge);
      setSuggestedChallenge(null);
    }
  };

  const handleInsightPress = (insight: AIInsight) => {
    markInsightAsRead(insight.id);
  };

  const activeChallenges = challenges.filter((c) => !c.completed);
  const completedChallenges = challenges.filter((c) => c.completed);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="💡"
        title="Недостаточно данных"
        message="Добавь несколько транзакций, чтобы получить AI-инсайты и рекомендации"
      />
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
      <Text style={styles.title}>AI-Инсайты</Text>

      {/* Предложенный челлендж */}
      {suggestedChallenge && (
        <Card style={[styles.card, styles.challengeCard]}>
          <Text style={styles.cardTitle}>⚡ Новый челлендж для тебя</Text>
          <Text style={styles.challengeTitle}>{suggestedChallenge.title}</Text>
          <Text style={styles.challengeDesc}>{suggestedChallenge.description}</Text>
          <View style={styles.challengeMeta}>
            <Badge text={`${suggestedChallenge.duration} дней`} variant="warning" />
            {suggestedChallenge.badge && (
              <Text style={styles.challengeBadge}>
                Награда: {suggestedChallenge.badge.icon} {suggestedChallenge.badge.name}
              </Text>
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
                <Text style={styles.actionableLabel}>💡 Совет:</Text>
                <Text style={styles.actionableText}>{insight.actionable}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Завершённые челленджи */}
      {completedChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Завершённые челленджи 🏆</Text>
          {completedChallenges.slice(0, 3).map((challenge) => (
            <Card key={challenge.id} style={styles.card}>
              <Text style={styles.completedTitle}>
                ✅ {challenge.title}
              </Text>
              {challenge.badge && (
                <Text style={styles.badgeEarned}>
                  {challenge.badge.icon} {challenge.badge.name}
                </Text>
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
  actionableLabel: {
    ...darkTheme.typography.bodySmall,
    fontWeight: '600',
    color: darkTheme.colors.primary,
    marginBottom: darkTheme.spacing.xs,
  },
  actionableText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.text,
  },
  completedTitle: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  badgeEarned: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.success,
  },
});
