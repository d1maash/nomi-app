import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Budget, TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/category-selector';
import { formatCurrency, parseDate } from '@/utils/format';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '@/constants/categories';
import { aiService } from '@/services/ai';
import { addDays } from 'date-fns';
import { triggerHaptic } from '@/utils/haptics';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useBudgets, useTransactions } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';

export default function BudgetsScreen() {
  const { budgets, add: addBudget, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { transactions, isLoading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const { userId, isInitialized } = useSupabase();
  
  const [budgetsWithPredictions, setBudgetsWithPredictions] = useState<
    (Budget & { prediction?: any })[]
  >([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draftBudget, setDraftBudget] = useState<{
    limit: string;
    category: TransactionCategory;
    period: Budget['period'];
  }>({
    limit: '',
    category: 'food',
    period: 'monthly',
  });

  const loadPredictions = useCallback(async () => {
    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const prediction = await aiService.predictSpending(
          transactions,
          budget.category,
          30
        );
        return { ...budget, prediction };
      })
    );
    setBudgetsWithPredictions(enriched);
  }, [budgets, transactions]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const calculateSpent = (budget: Budget): number => {
    const budgetStart = parseDate(budget.startDate);
    const budgetEnd = parseDate(budget.endDate);

    return transactions
      .filter(
        (t) => {
          const transactionDate = parseDate(t.date);
          return t.category === budget.category &&
            t.type === 'expense' &&
            transactionDate >= budgetStart &&
            transactionDate <= budgetEnd;
        }
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetStatus = (spent: number, limit: number): {
    variant: 'success' | 'warning' | 'error';
    label: string;
  } => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) {
      return { variant: 'error', label: 'Превышен' };
    }
    if (percentage >= 80) {
      return { variant: 'warning', label: 'Близко к лимиту' };
    }
    return { variant: 'success', label: 'В норме' };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBudgets(), refreshTransactions()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateBudget = async () => {
    const normalizedLimit = parseFloat(draftBudget.limit.replace(',', '.'));
    if (Number.isNaN(normalizedLimit) || !userId || !isInitialized) {
      return;
    }

    try {
      const startDate = new Date();
      const endDate = addDays(startDate, draftBudget.period === 'weekly' ? 7 : 30);

      // Сохраняем в Supabase
      await addBudget({
        category: draftBudget.category,
        limit: normalizedLimit,
        period: draftBudget.period,
        startDate,
        endDate,
      });

      triggerHaptic.success();
      setDraftBudget((prev) => ({
        ...prev,
        limit: '',
        category: 'food',
      }));
      setCreateModalVisible(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      triggerHaptic.error();
    }
  };

  const renderBudgetModal = () => (
    <Modal
      visible={createModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <Pressable style={styles.modalBackdrop} onPress={() => setCreateModalVisible(false)}>
        <Pressable
          style={styles.modalCard}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Новый бюджет</Text>
          <Input
            label="Лимит"
            value={draftBudget.limit}
            onChangeText={(value) =>
              setDraftBudget((prev) => ({ ...prev, limit: value }))
            }
            keyboardType="decimal-pad"
            placeholder="Например, 50000"
          />

          <Text style={styles.modalLabel}>Период</Text>
          <View style={styles.periodSelector}>
            {['weekly', 'monthly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodChip,
                  draftBudget.period === period && styles.periodChipSelected,
                ]}
                onPress={() =>
                  setDraftBudget((prev) => ({
                    ...prev,
                    period: period as Budget['period'],
                  }))
                }
              >
                <Text
                  style={[
                    styles.periodChipText,
                    draftBudget.period === period && styles.periodChipTextSelected,
                  ]}
                >
                  {period === 'weekly' ? 'Неделя' : 'Месяц'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Категория</Text>
          <CategorySelector
            selected={draftBudget.category}
            onSelect={(selectedCategory) => {
              if (selectedCategory === 'all') {
                return;
              }
              setDraftBudget((prev) => ({ ...prev, category: selectedCategory }));
            }}
            exclude={['income'] as TransactionCategory[]}
          />

          <View style={styles.modalActions}>
            <Button
              title="Отмена"
              variant="ghost"
              onPress={() => setCreateModalVisible(false)}
            />
            <Button
              title="Создать"
              onPress={handleCreateBudget}
              disabled={!draftBudget.limit}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Показываем индикатор загрузки только при первой загрузке
  if ((budgetsLoading || transactionsLoading) && budgets.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={darkTheme.colors.accent} />
        <Text style={styles.loadingText}>Загрузка бюджетов...</Text>
      </View>
    );
  }

  if (budgets.length === 0) {
    return (
      <>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.surface}
              title="Обновление..."
              titleColor={darkTheme.colors.textSecondary}
            />
          }
        >
          <EmptyState
            iconName="pie-chart"
            title="Нет бюджетов"
            message="Создай первый бюджет, чтобы контролировать расходы"
            actionLabel="Создать бюджет"
            onAction={() => setCreateModalVisible(true)}
          />
        </ScrollView>
        {renderBudgetModal()}
      </>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkTheme.colors.accent}
            colors={[darkTheme.colors.accent]}
            progressBackgroundColor={darkTheme.colors.surface}
            title="Обновление..."
            titleColor={darkTheme.colors.textSecondary}
          />
        }
      >
        <Text style={styles.title}>Мои бюджеты</Text>

        {budgetsWithPredictions.map((budget) => {
          const spent = calculateSpent(budget);
          const status = getBudgetStatus(spent, budget.limit);
          const percentage = (spent / budget.limit) * 100;

          return (
            <Card key={budget.id} style={styles.card} variant="elevated">
              <View style={styles.cardHeader}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: `${CATEGORY_COLORS[budget.category]}22`,
                        borderColor: `${CATEGORY_COLORS[budget.category]}55`,
                      },
                    ]}
                  >
                    <MonoIcon
                      name={CATEGORY_ICONS[budget.category]}
                      size={20}
                      color={darkTheme.colors.text}
                    />
                  </View>
                  <View>
                    <Text style={styles.categoryName}>
                      {CATEGORY_LABELS[budget.category]}
                    </Text>
                    <Text style={styles.periodLabel}>
                      {budget.period === 'weekly' ? 'Еженедельно' : 'Ежемесячно'}
                    </Text>
                  </View>
                </View>
                <Badge text={status.label} variant={status.variant} />
              </View>

              <View style={styles.amounts}>
                <Text style={styles.spent}>{formatCurrency(spent)}</Text>
                <Text style={styles.limit}>из {formatCurrency(budget.limit)}</Text>
              </View>

              <ProgressBar
                progress={percentage}
                color={
                  percentage >= 100
                    ? darkTheme.colors.error
                    : percentage >= 80
                    ? darkTheme.colors.warning
                    : darkTheme.colors.success
                }
                style={styles.progress}
              />

              {budget.prediction && (
                <View style={styles.prediction}>
                  <View style={styles.predictionHeader}>
                    <MonoIcon name="cpu" size={16} color={darkTheme.colors.text} />
                    <Text style={styles.predictionTitle}>AI-прогноз</Text>
                  </View>
                  <Text style={styles.predictionText}>
                    {budget.prediction.recommendation}
                  </Text>
                  <Text style={styles.predictionAmount}>
                    Ожидаемые траты до конца периода:{' '}
                    <Text style={styles.predictionValue}>
                      {formatCurrency(budget.prediction.predictedAmount)}
                    </Text>
                  </Text>
                </View>
              )}
            </Card>
          );
        })}

        <Button
          title="+ Добавить бюджет"
          onPress={() => setCreateModalVisible(true)}
          variant="secondary"
          size="large"
          style={styles.addButton}
        />
      </ScrollView>
      {renderBudgetModal()}
    </>
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
    padding: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  title: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xl,
  },
  card: {
    marginBottom: darkTheme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: darkTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
    borderWidth: 1,
  },
  categoryName: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
  },
  periodLabel: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
    marginTop: 2,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: darkTheme.spacing.sm,
  },
  spent: {
    ...darkTheme.typography.h2,
    color: darkTheme.colors.text,
    marginRight: darkTheme.spacing.xs,
  },
  limit: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  progress: {
    marginVertical: darkTheme.spacing.sm,
  },
  prediction: {
    marginTop: darkTheme.spacing.md,
    padding: darkTheme.spacing.md,
    backgroundColor: `${darkTheme.colors.primary}10`,
    borderRadius: darkTheme.borderRadius.sm,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.xs,
  },
  predictionTitle: {
    ...darkTheme.typography.bodySmall,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  predictionText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.xs,
  },
  predictionAmount: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
  },
  predictionValue: {
    fontWeight: '600',
    color: darkTheme.colors.primary,
  },
  addButton: {
    marginTop: darkTheme.spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: darkTheme.spacing.xl,
  },
  modalCard: {
    backgroundColor: darkTheme.colors.backgroundSoft,
    borderRadius: darkTheme.borderRadius.xl,
    padding: darkTheme.spacing.xl,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  modalTitle: {
    ...darkTheme.typography.h2,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.lg,
  },
  modalLabel: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
    marginBottom: darkTheme.spacing.xs,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: darkTheme.spacing.sm,
    marginBottom: darkTheme.spacing.lg,
  },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: darkTheme.spacing.sm,
    borderRadius: darkTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
  },
  periodChipSelected: {
    backgroundColor: darkTheme.colors.primary,
    borderColor: 'transparent',
  },
  periodChipText: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  periodChipTextSelected: {
    color: darkTheme.colors.background,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: darkTheme.spacing.lg,
    gap: darkTheme.spacing.md,
  },
});
