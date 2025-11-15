import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { darkTheme } from '@/styles/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, parseDate } from '@/utils/format';
import { aiService } from '@/services/ai';
import { triggerHaptic } from '@/utils/haptics';
import { startOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { MonoIcon } from '@/components/ui/mono-icon';
import { useTransactions, useBudgets, useGoals, useChallenges, useInsights } from '@/hooks/use-supabase';
import { useSupabase } from '@/components/supabase-provider';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [todayInsight, setTodayInsight] = useState<string>('');
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Загружаем данные из Supabase
  const { transactions, isLoading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const { budgets, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { goals, isLoading: goalsLoading, refresh: refreshGoals } = useGoals();
  const { challenges, isLoading: challengesLoading, refresh: refreshChallenges } = useChallenges();
  const { insights, isLoading: insightsLoading, refresh: refreshInsights } = useInsights();
  const { isInitialized } = useSupabase();

  // Вычисления
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const todayTransactions = transactions.filter(
    (t) => parseDate(t.date) >= todayStart
  );

  const todayExpenses = todayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const weekExpenses = transactions
    .filter(
      (t) => {
        const transactionDate = parseDate(t.date);
        return t.type === 'expense' &&
          transactionDate >= weekStart &&
          transactionDate <= weekEnd;
      }
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const activeGoal = goals.find((g) => g.currentAmount < g.targetAmount);
  const activeChallenge = challenges.find((c) => !c.completed);
  const latestInsight = insights.find((i) => !i.read);
  const recentTransactions = transactions.slice(0, 5);
  const greetingText = profile?.first_name ? `Привет, ${profile.first_name}!` : 'Привет!';
  const userInitials = useMemo(() => {
    if (!profile) return 'Г';
    const first = profile.first_name?.[0];
    const last = profile.last_name?.[0];
    const usernameLetter = profile.username?.[0];
    return (first ?? last ?? usernameLetter ?? '👤').toString().toUpperCase();
  }, [profile]);

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
    try {
      // Обновляем все данные из Supabase
      await Promise.all([
        refreshTransactions(),
        refreshBudgets(),
        refreshGoals(),
        refreshChallenges(),
        refreshInsights(),
      ]);
      // Затем регенерируем инсайт на основе свежих данных
      await loadInsight();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTransaction = () => {
    triggerHaptic.medium();
    router.push('/add-transaction');
  };

  const handleAccountPress = () => {
    triggerHaptic.light();
    if (!supabaseConfigured) {
      Alert.alert(
        'Supabase не настроен',
        'Добавь EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в .env'
      );
      return;
    }

    if (!user) {
      router.push('/auth');
      return;
    }

    setProfileForm({
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      username: profile?.username ?? '',
    });
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    if (profileSaving) {
      return;
    }
    setProfileModalVisible(false);
  };

  const handleProfileSave = async () => {
    if (!user || profileSaving) return;

    const trimmedFirstName = profileForm.firstName.trim();
    const trimmedLastName = profileForm.lastName.trim();
    const trimmedUsername = profileForm.username.trim();

    // Проверяем, что хотя бы одно поле изменилось
    const firstNameChanged = trimmedFirstName !== (profile?.first_name ?? '');
    const lastNameChanged = trimmedLastName !== (profile?.last_name ?? '');
    const usernameChanged = trimmedUsername && trimmedUsername !== (profile?.username ?? '');

    if (!firstNameChanged && !lastNameChanged && !usernameChanged) {
      Alert.alert('Изменений нет', 'Обнови хотя бы одно поле, прежде чем сохранять.');
      return;
    }

    try {
      setProfileSaving(true);

      const updates: any = {};
      if (firstNameChanged) updates.first_name = trimmedFirstName || null;
      if (lastNameChanged) updates.last_name = trimmedLastName || null;
      if (usernameChanged) updates.username = trimmedUsername || null;

      const { error } = await updateProfile(updates);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Ошибка', error.message || 'Не удалось обновить профиль');
        return;
      }

      triggerHaptic.success();
      Alert.alert('Успех', 'Профиль успешно обновлен!');
      setProfileModalVisible(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    } finally {
      setProfileSaving(false);
    }
  };

  const renderProfileModal = () => {
    if (!isProfileModalVisible) {
      return null;
    }

    return (
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeProfileModal}
      >
        <Pressable style={styles.profileModalBackdrop} onPress={closeProfileModal}>
          <Pressable
            style={styles.profileModalCard}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Профиль</Text>
              <Text style={styles.profileModalSubtitle}>
                Обнови никнейм, имя и фамилию. Изменения сохранятся в Clerk.
              </Text>
            </View>

            <View style={styles.profileFieldGroup}>
              <Text style={styles.profileFieldLabel}>Имя</Text>
              <TextInput
                value={profileForm.firstName}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="Например, Айгерим"
                placeholderTextColor={darkTheme.colors.textTertiary}
                style={styles.profileInput}
              />
            </View>

            <View style={styles.profileFieldGroup}>
              <Text style={styles.profileFieldLabel}>Фамилия</Text>
              <TextInput
                value={profileForm.lastName}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, lastName: text }))
                }
                placeholder="Фамилия"
                placeholderTextColor={darkTheme.colors.textTertiary}
                style={styles.profileInput}
              />
            </View>

            <View style={styles.profileFieldGroup}>
              <Text style={styles.profileFieldLabel}>Никнейм</Text>
              <TextInput
                value={profileForm.username}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, username: text }))
                }
                autoCapitalize="none"
                placeholder="Например, nomi_user"
                placeholderTextColor={darkTheme.colors.textTertiary}
                style={styles.profileInput}
              />
            </View>

            <View style={styles.profileModalActions}>
              <Button
                title="Отмена"
                variant="ghost"
                onPress={closeProfileModal}
                disabled={profileSaving}
              />
              <Button
                title="Сохранить"
                onPress={handleProfileSave}
                loading={profileSaving}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  // Показываем индикатор загрузки только при первой загрузке
  const isInitialLoading = (transactionsLoading || budgetsLoading || goalsLoading || challengesLoading) && 
    transactions.length === 0 && budgets.length === 0 && goals.length === 0 && challenges.length === 0;

  if (isInitialLoading) {
    return (
      <>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkTheme.colors.accent} />
          <Text style={styles.loadingText}>Загрузка данных...</Text>
        </View>
        {renderProfileModal()}
      </>
    );
  }

  // Показываем пустое состояние только если данные загружены и транзакций нет
  if (!transactionsLoading && transactions.length === 0) {
    return (
      <>
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
            iconName="pocket"
            title="Начни отслеживать траты"
            message="Добавь свою первую транзакцию, чтобы увидеть аналитику и AI-инсайты"
            actionLabel="Добавить транзакцию"
            onAction={handleAddTransaction}
          />
        </ScrollView>
        {renderProfileModal()}
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
            onRefresh={onRefresh}
            tintColor={darkTheme.colors.accent}
            colors={[darkTheme.colors.accent]}
            progressBackgroundColor={darkTheme.colors.surface}
            title="Обновление..."
            titleColor={darkTheme.colors.textSecondary}
          />
        }
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>{greetingText}</Text>
                <View style={styles.greetingIcon}>
                  <MonoIcon name="smile" size={18} color={darkTheme.colors.text} />
                </View>
              </View>
              <Text style={styles.date}>{formatDate(new Date(), 'EEEE, d MMMM')}</Text>
            </View>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={handleAccountPress}
              activeOpacity={0.8}
            >
              {supabaseConfigured ? (
                <>
                  {authLoading ? (
                    <ActivityIndicator color={darkTheme.colors.text} />
                  ) : profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.accountImage} />
                  ) : (
                    <Text style={styles.accountInitials}>{userInitials}</Text>
                  )}
                </>
              ) : (
                <MonoIcon name="user" size={20} color={darkTheme.colors.text} />
              )}
            </TouchableOpacity>
          </View>
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
            <View style={styles.cardTitleRow}>
              <MonoIcon name="target" size={18} color={darkTheme.colors.text} />
              <Text style={styles.cardTitle}>{activeGoal.name}</Text>
            </View>
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
            <View style={styles.cardTitleRow}>
              <MonoIcon name="activity" size={18} color={darkTheme.colors.text} />
              <Text style={styles.cardTitle}>{activeChallenge.title}</Text>
            </View>
            <Badge text={`${activeChallenge.streak} дн.`} variant="warning" />
          </View>
          <Text style={styles.cardSubtext}>{activeChallenge.description}</Text>
          <ProgressBar progress={activeChallenge.progress} style={styles.progress} />
        </Card>
      )}

      {/* AI-инсайт */}
      {(todayInsight || latestInsight) && (
        <Card style={styles.card} variant="tinted">
          <View style={styles.cardTitleRow}>
            <MonoIcon name="cpu" size={18} color={darkTheme.colors.text} />
            <Text style={styles.insightTitle}>AI-совет</Text>
          </View>
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
            <View style={styles.sectionLink}>
              <Text style={styles.sectionLinkText}>Все</Text>
              <MonoIcon name="arrow-up-right" size={16} color={darkTheme.colors.textSecondary} />
            </View>
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
      {renderProfileModal()}
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
  header: {
    marginBottom: darkTheme.spacing.xl,
    gap: darkTheme.spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
  },
  greeting: {
    ...darkTheme.typography.h1,
    color: darkTheme.colors.text,
  },
  greetingIcon: {
    width: 32,
    height: 32,
    borderRadius: darkTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.surfaceLight,
  },
  date: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.textSecondary,
  },
  accountButton: {
    width: 48,
    height: 48,
    borderRadius: darkTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    backgroundColor: darkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountImage: {
    width: '100%',
    height: '100%',
    borderRadius: darkTheme.borderRadius.full,
  },
  accountInitials: {
    ...darkTheme.typography.body,
    color: darkTheme.colors.text,
    fontWeight: '600',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionLinkText: {
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
  profileModalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: darkTheme.spacing.xl,
  },
  profileModalCard: {
    width: '100%',
    backgroundColor: darkTheme.colors.surface,
    borderRadius: darkTheme.borderRadius.xl,
    padding: darkTheme.spacing.xl,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    gap: darkTheme.spacing.md,
  },
  profileModalHeader: {
    gap: darkTheme.spacing.xs,
  },
  profileModalTitle: {
    ...darkTheme.typography.h3,
    color: darkTheme.colors.text,
  },
  profileModalSubtitle: {
    ...darkTheme.typography.bodySmall,
    color: darkTheme.colors.textSecondary,
  },
  profileFieldGroup: {
    gap: darkTheme.spacing.xs,
  },
  profileFieldLabel: {
    ...darkTheme.typography.caption,
    color: darkTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileInput: {
    ...darkTheme.typography.body,
    borderWidth: 1,
    borderColor: darkTheme.colors.cardBorder,
    borderRadius: darkTheme.borderRadius.lg,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
    backgroundColor: darkTheme.colors.backgroundSoft,
    color: darkTheme.colors.text,
  },
  profileModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
  },
});
