import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useStore } from '@/store';
import { Budget, TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/category-selector';
import { formatCurrency } from '@/utils/format';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/constants/categories';
import { aiService } from '@/services/ai';
import { addDays } from 'date-fns';
import { triggerHaptic } from '@/utils/haptics';

export default function BudgetsScreen() {
  const budgets = useStore((state) => state.budgets);
  const transactions = useStore((state) => state.transactions);
  const addBudget = useStore((state) => state.addBudget);
  
  const [budgetsWithPredictions, setBudgetsWithPredictions] = useState<
    (Budget & { prediction?: any })[]
  >([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
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
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);

    return transactions
      .filter(
        (t) =>
          t.category === budget.category &&
          t.type === 'expense' &&
          new Date(t.date) >= budgetStart &&
          new Date(t.date) <= budgetEnd
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

  const handleCreateBudget = () => {
    const normalizedLimit = parseFloat(draftBudget.limit.replace(',', '.'));
    if (Number.isNaN(normalizedLimit)) {
      return;
    }

    const startDate = new Date();
    const endDate = addDays(startDate, draftBudget.period === 'weekly' ? 7 : 30);

    addBudget({
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
            onSelect={(category) =>
              setDraftBudget((prev) => ({ ...prev, category }))
            }
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

  if (budgets.length === 0) {
    return (
      <>
        <EmptyState
          icon="📊"
          title="Нет бюджетов"
          message="Создай первый бюджет, чтобы контролировать расходы"
          actionLabel="Создать бюджет"
          onAction={() => setCreateModalVisible(true)}
        />
        {renderBudgetModal()}
      </>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Мои бюджеты</Text>

        {budgetsWithPredictions.map((budget) => {
          const spent = calculateSpent(budget);
          const status = getBudgetStatus(spent, budget.limit);
          const percentage = (spent / budget.limit) * 100;

          return (
            <Card key={budget.id} style={styles.card} variant="elevated">
              <View style={styles.cardHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[budget.category]}
                  </Text>
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
                  <Text style={styles.predictionTitle}>🤖 AI-прогноз</Text>
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
    fontSize: 32,
    marginRight: darkTheme.spacing.sm,
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
  predictionTitle: {
    ...darkTheme.typography.bodySmall,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
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
