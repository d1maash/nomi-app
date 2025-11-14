import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { Transaction, TransactionCategory } from '@/types';
import { darkTheme } from '@/styles/theme';
import { TransactionItem } from '@/components/transaction-item';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategorySelector } from '@/components/category-selector';

export default function TransactionsScreen() {
  const router = useRouter();
  const transactions = useStore((state) => state.transactions);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all');

  // Фильтрация и поиск
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchQuery, filterCategory]);

  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/transaction/${transaction.id}`);
  };

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Транзакции</Text>
        <Text style={styles.subtitle}>
          {filteredTransactions.length} операций
        </Text>
      </View>
      {/* Поиск */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Поиск по описанию..."
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Фильтр по категориям */}
      <CategorySelector
        selected={filterCategory as TransactionCategory}
        onSelect={(cat) => setFilterCategory(cat)}
      />

      {/* Список транзакций */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Нет транзакций"
          message={
            searchQuery || filterCategory !== 'all'
              ? 'Попробуй изменить фильтры'
              : 'Добавь свою первую транзакцию'
          }
          actionLabel={searchQuery || filterCategory !== 'all' ? undefined : 'Добавить'}
          onAction={searchQuery || filterCategory !== 'all' ? undefined : handleAddTransaction}
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => handleTransactionPress(item)}
            />
          )}
          style={styles.listWrapper}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Кнопка добавления */}
      <View style={styles.fab}>
        <Button
          title="Добавить"
          onPress={handleAddTransaction}
          variant="primary"
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
  },
  pageHeader: {
    padding: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.sm,
  },
  title: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
  },
  subtitle: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
    marginTop: darkTheme.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listWrapper: {
    flex: 1,
  },
  list: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  fab: {
    padding: darkTheme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.cardBorder,
  },
});
