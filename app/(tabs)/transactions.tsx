import { CategorySelector } from '@/components/category-selector';
import { useSupabase } from '@/components/supabase-provider';
import { TransactionItem } from '@/components/transaction-item';
import { EmptyState } from '@/components/ui/empty-state';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useTransactions } from '@/hooks/use-supabase';
import { darkTheme } from '@/styles/theme';
import { Transaction, TransactionCategory } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { differenceInCalendarMonths, isToday, isYesterday, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsScreen() {
    const router = useRouter();
    const { transactions, isLoading } = useTransactions();
    const { isInitialized } = useSupabase();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all');
    const [sortDesc, setSortDesc] = useState(true);

    // Фильтрация и поиск
    const filteredTransactions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const filtered = transactions.filter((t) => {
            const matchesSearch = t.description.toLowerCase().includes(normalizedSearch);
            const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        return filtered.sort((a, b) => {
            const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
            return sortDesc ? diff : -diff;
        });
    }, [transactions, searchQuery, filterCategory, sortDesc]);

    // Группировка по датам
    const groupedTransactions = useMemo(() => {
        const groups: Array<{ title: string; subtitle: string; total: number; data: Transaction[] }> = [];
        const dateMap = new Map<string, Transaction[]>();

        filteredTransactions.forEach((transaction) => {
            const dateKey = startOfDay(new Date(transaction.date)).toISOString();
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, []);
            }
            dateMap.get(dateKey)!.push(transaction);
        });

        Array.from(dateMap.entries()).forEach(([dateKey, txs]) => {
            const date = new Date(dateKey);
            let title = formatDate(date, 'dd MMMM yyyy');
            if (isToday(date)) title = 'Сегодня';
            else if (isYesterday(date)) title = 'Вчера';

            const total = txs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
            const subtitle = `${txs.length} ${txs.length === 1 ? 'операция' : 'операций'}`;

            groups.push({ title, subtitle, total, data: txs });
        });

        return groups.sort((a, b) => {
            const dateA = new Date(a.data[0].date).getTime();
            const dateB = new Date(b.data[0].date).getTime();
            return sortDesc ? dateB - dateA : dateA - dateB;
        });
    }, [filteredTransactions, sortDesc]);

    // Статистика
    const stats = useMemo(() => {
        const income = filteredTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentMonth = new Date();
        const monthlyExpense = filteredTransactions
            .filter(
                (t) => t.type === 'expense' && differenceInCalendarMonths(currentMonth, new Date(t.date)) === 0
            )
            .reduce((sum, t) => sum + t.amount, 0);

        return { income, expense, balance: income - expense, monthlyExpense };
    }, [filteredTransactions]);

    const handleTransactionPress = (transaction: Transaction) => {
        router.push(`/transaction/${transaction.id}`);
    };

    const handleAddTransaction = () => {
        router.push('/add-transaction');
    };

    return (
        <View style={styles.container}>
            {/* Заголовок и статистика */}
            <View style={styles.pageHeader}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Транзакции</Text>
                        <Text style={styles.subtitle}>
                            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'операция' : 'операций'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
                        <MonoIcon name="plus" size={20} color={darkTheme.colors.background} />
                    </TouchableOpacity>
                </View>

                {/* Статистика */}
                {transactions.length > 0 && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <View style={styles.statIconBadge}>
                                    <MonoIcon name="arrow-up-circle" size={18} color={darkTheme.colors.accent} />
                                </View>
                                <View style={styles.statInfo}>
                                    <Text style={styles.statLabel}>Доход</Text>
                                    <Text style={[styles.statValue, styles.statIncome]}>
                                        {formatCurrency(stats.income)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statIconBadge}>
                                    <MonoIcon name="arrow-down-circle" size={18} color={darkTheme.colors.accent} />
                                </View>
                                <View style={styles.statInfo}>
                                    <Text style={styles.statLabel}>Расход</Text>
                                    <Text style={[styles.statValue, styles.statExpense]}>
                                        {formatCurrency(stats.expense)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.statCardWide}>
                            <View style={styles.statIconBadge}>
                                <MonoIcon name="calendar" size={18} color={darkTheme.colors.accent} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Траты этого месяца</Text>
                                <Text style={styles.statValue}>
                                    {formatCurrency(stats.monthlyExpense)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Поиск и сортировка */}
            <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                    <View style={styles.searchIconBadge}>
                        <MonoIcon name="search" size={16} color={darkTheme.colors.accent} />
                    </View>
                    <TextInput
                        value={searchQuery}
                        onChangeText={(text) => setSearchQuery(text)}
                        placeholder="Поиск транзакций..."
                        placeholderTextColor={darkTheme.colors.textTertiary}
                        style={styles.searchInputNative}
                    />
                </View>
                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSortDesc((prev) => !prev);
                    }}
                >
                    <MonoIcon name={sortDesc ? 'chevron-down' : 'chevron-up'} size={18} color={darkTheme.colors.accent} />
                </TouchableOpacity>
            </View>

            {/* Фильтр по категориям */}
            <CategorySelector
                selected={filterCategory}
                onSelect={(cat) => setFilterCategory(cat)}
                showAllOption
            />

            {/* Список транзакций с группировкой */}
            {filteredTransactions.length === 0 ? (
                <EmptyState
                    iconName="layers"
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
                <SectionList
                    sections={groupedTransactions}
                    keyExtractor={(item) => item.id}
                    renderSectionHeader={({ section }) => (
                        <View style={styles.dateHeader}>
                            <View style={styles.dateHeaderLeft}>
                                <View style={styles.dateIconBadge}>
                                    <MonoIcon name="clock" size={14} color={darkTheme.colors.accent} />
                                </View>
                                <View>
                                    <Text style={styles.dateLabel}>{section.title}</Text>
                                    <Text style={styles.dateSubtitle}>{section.subtitle}</Text>
                                </View>
                            </View>
                            <View style={styles.dateSummary}>
                                <Text style={styles.dateSummaryText}>{formatCurrency(section.total)}</Text>
                            </View>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TransactionItem transaction={item} onPress={() => handleTransactionPress(item)} />
                    )}
                    style={styles.listWrapper}
                    contentContainerStyle={styles.list}
                    stickySectionHeadersEnabled
                />
            )}
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
        paddingBottom: darkTheme.spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: darkTheme.spacing.lg,
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
    addButton: {
        width: 48,
        height: 48,
        borderRadius: darkTheme.borderRadius.full,
        backgroundColor: darkTheme.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsContainer: {
        gap: darkTheme.spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        gap: darkTheme.spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        flexDirection: 'column',
        gap: darkTheme.spacing.sm,
        minHeight: 85,
    },
    statCardWide: {
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.lg,
        padding: darkTheme.spacing.md,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.md,
        minHeight: 70,
    },
    statIconBadge: {
        width: 36,
        height: 36,
        borderRadius: darkTheme.borderRadius.md,
        backgroundColor: darkTheme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
    },
    statInfo: {
        flex: 1,
    },
    statLabel: {
        ...darkTheme.typography.caption,
        color: darkTheme.colors.textSecondary,
        marginBottom: 4,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        ...darkTheme.typography.h3,
        fontWeight: '700',
        color: darkTheme.colors.text,
        fontSize: 18,
    },
    statIncome: {
        color: darkTheme.colors.success,
    },
    statExpense: {
        color: darkTheme.colors.error,
    },
    searchContainer: {
        paddingHorizontal: darkTheme.spacing.xl,
        paddingBottom: darkTheme.spacing.sm,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.sm,
        paddingHorizontal: darkTheme.spacing.xl,
        marginBottom: darkTheme.spacing.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.sm,
        backgroundColor: darkTheme.colors.surface,
        borderRadius: darkTheme.borderRadius.lg,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.sm,
        height: 48,
    },
    searchIconBadge: {
        width: 32,
        height: 32,
        borderRadius: darkTheme.borderRadius.md,
        backgroundColor: darkTheme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInputNative: {
        flex: 1,
        ...darkTheme.typography.body,
        color: darkTheme.colors.text,
        paddingVertical: 0,
        fontSize: 14,
    },
    sortButton: {
        width: 48,
        height: 48,
        borderRadius: darkTheme.borderRadius.lg,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
        backgroundColor: darkTheme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listWrapper: {
        flex: 1,
    },
    list: {
        paddingHorizontal: darkTheme.spacing.xl,
        paddingBottom: darkTheme.spacing.xxl,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: darkTheme.spacing.md,
        paddingHorizontal: darkTheme.spacing.sm,
        marginBottom: darkTheme.spacing.sm,
        backgroundColor: darkTheme.colors.backgroundSoft,
        borderRadius: darkTheme.borderRadius.md,
    },
    dateHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: darkTheme.spacing.sm,
    },
    dateIconBadge: {
        width: 28,
        height: 28,
        borderRadius: darkTheme.borderRadius.sm,
        backgroundColor: darkTheme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
    },
    dateLabel: {
        ...darkTheme.typography.bodySmall,
        fontWeight: '700',
        color: darkTheme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontSize: 12,
    },
    dateSubtitle: {
        ...darkTheme.typography.caption,
        color: darkTheme.colors.textSecondary,
        fontSize: 10,
        marginTop: 2,
    },
    dateSummary: {
        backgroundColor: darkTheme.colors.surface,
        paddingHorizontal: darkTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: darkTheme.borderRadius.sm,
        borderWidth: 1,
        borderColor: darkTheme.colors.cardBorder,
    },
    dateSummaryText: {
        ...darkTheme.typography.caption,
        fontWeight: '700',
        color: darkTheme.colors.text,
        fontSize: 11,
    },
});
