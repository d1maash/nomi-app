import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/category-selector';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';

export default function AddTransactionScreen() {
  const router = useRouter();
  const addTransaction = useStore((state) => state.addTransaction);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [isIncome, setIsIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoryDirty, setIsCategoryDirty] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) {
      return;
    }

    setLoading(true);
    triggerHaptic.medium();

    try {
      const normalizedAmount = parseFloat(amount.replace(',', '.'));
      if (Number.isNaN(normalizedAmount)) {
        return;
      }

      let finalCategory = category;
      let aiSuggested = false;

      if (!isIncome) {
        try {
          const result = await aiService.categorizeTransaction(description, normalizedAmount);
          if (result.confidence > 0.6 && !isCategoryDirty) {
            finalCategory = result.category;
            aiSuggested = true;
          } else if (isCategoryDirty && result.category !== category) {
            await aiService.learnFromCategorizationCorrection(
              description,
              result.category,
              category
            );
          }
        } catch (error) {
          console.warn('AI categorization failed', error);
        }
      }

      addTransaction({
        amount: normalizedAmount,
        description,
        category: finalCategory,
        type: isIncome ? 'income' : 'expense',
        date: new Date(),
        aiSuggested,
      });

      triggerHaptic.success();
      router.back();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Сумма"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
        style={styles.amountInput}
      />

      <Input
        label="Описание"
        value={description}
        onChangeText={setDescription}
        placeholder="Название магазина или услуги"
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Это доход</Text>
        <Switch
          value={isIncome}
          onValueChange={(value) => {
            setIsIncome(value);
            setIsCategoryDirty(false);
            setCategory((prev) => {
              if (value) {
                return 'income';
              }
              return prev === 'income' ? 'food' : prev;
            });
          }}
          trackColor={{
            false: darkTheme.colors.surfaceLight,
            true: darkTheme.colors.primary,
          }}
          thumbColor={darkTheme.colors.background}
        />
      </View>

      {!isIncome && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Категория</Text>
            {isCategoryDirty && <Text style={styles.sectionHint}>выбрано вручную</Text>}
          </View>
          <CategorySelector
            selected={category}
            onSelect={(selected) => {
              setCategory(selected);
              setIsCategoryDirty(true);
            }}
            exclude={['income'] as TransactionCategory[]}
          />
        </View>
      )}

      <Button
        title="Добавить"
        onPress={handleSubmit}
        variant="primary"
        size="large"
        disabled={!amount || !description}
        loading={loading}
        style={styles.submitButton}
      />
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
    gap: darkTheme.spacing.lg,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: darkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.cardBorder,
  },
  switchLabel: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
  },
  section: {
    marginBottom: darkTheme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkTheme.spacing.xs,
  },
  sectionLabel: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  sectionHint: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
  },
  hint: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textTertiary,
    marginTop: darkTheme.spacing.xs,
  },
  submitButton: {
    marginTop: darkTheme.spacing.lg,
  },
});
