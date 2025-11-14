import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/category-selector';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';
import { useTransactions } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { add: addTransaction } = useTransactions();
  const { userId, isInitialized } = useSupabase();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [isIncome, setIsIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoryDirty, setIsCategoryDirty] = useState(false);

  const handleAmountChange = (text: string) => {
    // Убираем все кроме цифр, запятой и точки
    const cleaned = text.replace(/[^\d.,]/g, '');
    
    // Заменяем запятые на точки для единообразия
    const normalized = cleaned.replace(/,/g, '.');
    
    // Если есть несколько точек, оставляем только первую
    const parts = normalized.split('.');
    const formatted = parts.length > 1 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : normalized;
    
    setAmount(formatted);
  };

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '';
    
    const parts = value.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Форматируем целую часть с пробелами
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
  };

  const handleSubmit = async () => {
    if (!amount || !description || !userId || !isInitialized) {
      return;
    }

    setLoading(true);
    triggerHaptic.medium();

    try {
      // Убираем пробелы и заменяем запятые на точки
      const cleanedAmount = amount.replace(/\s/g, '').replace(',', '.');
      const normalizedAmount = parseFloat(cleanedAmount);
      if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
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

      // Сохраняем в Supabase
      await addTransaction({
        amount: normalizedAmount,
        description,
        category: finalCategory,
        type: isIncome ? 'income' : 'expense',
        date: new Date(),
        aiSuggested,
        tags: [],
      });

      triggerHaptic.success();
      router.back();
    } catch (error) {
      console.error('Error adding transaction:', error);
      triggerHaptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.amountContainer}>
        <Input
          label="Сумма"
          value={formatAmountDisplay(amount)}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholder="0"
          style={styles.amountInput}
        />
      </View>

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
            onSelect={(selectedCategory) => {
              if (selectedCategory === 'all') {
                return;
              }
              setCategory(selectedCategory);
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
  amountContainer: {
    marginBottom: darkTheme.spacing.md,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'left',
    textAlignVertical: 'center',
    paddingTop: darkTheme.spacing.md,
    paddingBottom: darkTheme.spacing.md,
    minHeight: 72,
    lineHeight: 36,
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
