import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import {
    Transaction,
    Budget,
    Goal,
    AIInsight,
    Challenge,
    Badge,
    AnomalyAlert,
    GameStats,
    AppSettings,
} from '@/types';
import { formatDateForDB } from '@/utils/format';

// Хелпер для получения user_id по clerk_id
export async function getUserId(clerkId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single();

    if (error) {
        console.error('Error getting user id:', error);
        return null;
    }

    return data?.id || null;
}

// Создание или обновление пользователя
export async function upsertUser(clerkId: string, email: string, name?: string) {
    const { data, error } = await supabase
        .from('users')
        .upsert({
            clerk_id: clerkId,
            email,
            name,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting user:', error);
        throw error;
    }

    return data;
}

// === ТРАНЗАКЦИИ ===
export async function getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        category: t.category as any,
        description: t.description,
        date: new Date(t.date),
        type: t.type,
        aiSuggested: t.ai_suggested || false,
        tags: t.tags || [],
        recurring: t.recurring_frequency
            ? {
                frequency: t.recurring_frequency,
                nextDate: new Date(t.recurring_next_date || ''),
            }
            : undefined,
        createdAt: new Date(t.created_at || ''),
        updatedAt: new Date(t.updated_at || ''),
    }));
}

export async function createTransaction(
    userId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
) {
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: formatDateForDB(transaction.date),
            type: transaction.type,
            ai_suggested: transaction.aiSuggested,
            tags: transaction.tags || [],
            recurring_frequency: transaction.recurring?.frequency,
            recurring_next_date: transaction.recurring?.nextDate ? formatDateForDB(transaction.recurring.nextDate) : null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }

    return data;
}

export async function updateTransaction(
    id: string,
    updates: Partial<Transaction>
) {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.description !== undefined)
        updateData.description = updates.description;
    if (updates.date !== undefined) updateData.date = formatDateForDB(updates.date);
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.aiSuggested !== undefined)
        updateData.ai_suggested = updates.aiSuggested;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.recurring !== undefined) {
        updateData.recurring_frequency = updates.recurring.frequency;
        updateData.recurring_next_date = formatDateForDB(updates.recurring.nextDate);
    }

    const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }

    return data;
}

export async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

// === БЮДЖЕТЫ ===
export async function getBudgets(userId: string): Promise<Budget[]> {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching budgets:', error);
        return [];
    }

    return data.map((b) => ({
        id: b.id,
        category: b.category as any,
        limit: Number(b.limit_amount),
        spent: Number(b.spent || 0),
        period: b.period,
        startDate: new Date(b.start_date),
        endDate: new Date(b.end_date),
        aiPrediction: b.ai_predicted_spend
            ? {
                predictedSpend: Number(b.ai_predicted_spend),
                confidence: Number(b.ai_confidence || 0),
                recommendation: b.ai_recommendation || '',
            }
            : undefined,
    }));
}

export async function createBudget(
    userId: string,
    budget: Omit<Budget, 'id' | 'spent'>
) {
    const { data, error } = await supabase
        .from('budgets')
        .insert({
            user_id: userId,
            category: budget.category,
            limit_amount: budget.limit,
            period: budget.period,
            start_date: formatDateForDB(budget.startDate),
            end_date: formatDateForDB(budget.endDate),
            ai_predicted_spend: budget.aiPrediction?.predictedSpend,
            ai_confidence: budget.aiPrediction?.confidence,
            ai_recommendation: budget.aiPrediction?.recommendation,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating budget:', error);
        throw error;
    }

    return data;
}

export async function updateBudget(id: string, updates: Partial<Budget>) {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.limit !== undefined) updateData.limit_amount = updates.limit;
    if (updates.spent !== undefined) updateData.spent = updates.spent;
    if (updates.period !== undefined) updateData.period = updates.period;
    if (updates.startDate !== undefined)
        updateData.start_date = formatDateForDB(updates.startDate);
    if (updates.endDate !== undefined)
        updateData.end_date = formatDateForDB(updates.endDate);
    if (updates.aiPrediction !== undefined) {
        updateData.ai_predicted_spend = updates.aiPrediction.predictedSpend;
        updateData.ai_confidence = updates.aiPrediction.confidence;
        updateData.ai_recommendation = updates.aiPrediction.recommendation;
    }

    const { data, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating budget:', error);
        throw error;
    }

    return data;
}

export async function deleteBudget(id: string) {
    const { error } = await supabase.from('budgets').delete().eq('id', id);

    if (error) {
        console.error('Error deleting budget:', error);
        throw error;
    }
}

// === ЦЕЛИ ===
export async function getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching goals:', error);
        return [];
    }

    return data.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount || 0),
        deadline: new Date(g.deadline),
        category: g.category,
        aiETA: g.ai_estimated_date
            ? {
                estimatedDate: new Date(g.ai_estimated_date),
                recommendedWeeklySaving: Number(g.ai_recommended_weekly_saving || 0),
                riskLevel: g.ai_risk_level || 'low',
                note: g.ai_note || '',
            }
            : undefined,
        createdAt: new Date(g.created_at || ''),
        updatedAt: new Date(g.updated_at || ''),
    }));
}

export async function createGoal(
    userId: string,
    goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
) {
    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id: userId,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: goal.currentAmount,
            deadline: formatDateForDB(goal.deadline),
            category: goal.category,
            ai_estimated_date: goal.aiETA?.estimatedDate ? formatDateForDB(goal.aiETA.estimatedDate) : null,
            ai_recommended_weekly_saving: goal.aiETA?.recommendedWeeklySaving,
            ai_risk_level: goal.aiETA?.riskLevel,
            ai_note: goal.aiETA?.note,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating goal:', error);
        throw error;
    }

    return data;
}

export async function updateGoal(id: string, updates: Partial<Goal>) {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.targetAmount !== undefined)
        updateData.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined)
        updateData.current_amount = updates.currentAmount;
    if (updates.deadline !== undefined)
        updateData.deadline = formatDateForDB(updates.deadline);
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.aiETA !== undefined) {
        updateData.ai_estimated_date = formatDateForDB(updates.aiETA.estimatedDate);
        updateData.ai_recommended_weekly_saving =
            updates.aiETA.recommendedWeeklySaving;
        updateData.ai_risk_level = updates.aiETA.riskLevel;
        updateData.ai_note = updates.aiETA.note;
    }

    const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating goal:', error);
        throw error;
    }

    return data;
}

export async function deleteGoal(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id);

    if (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
}

// === ИНСАЙТЫ ===
export async function getInsights(userId: string): Promise<AIInsight[]> {
    const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching insights:', error);
        return [];
    }

    return data.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        message: i.message,
        actionable: i.actionable,
        priority: i.priority,
        category: i.category as any,
        date: new Date(i.date),
        read: i.read || false,
    }));
}

export async function createInsight(
    userId: string,
    insight: Omit<AIInsight, 'id'>
) {
    const { data, error } = await supabase
        .from('ai_insights')
        .insert({
            user_id: userId,
            type: insight.type,
            title: insight.title,
            message: insight.message,
            actionable: insight.actionable,
            priority: insight.priority,
            category: insight.category,
            date: insight.date.toISOString(),
            read: insight.read,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating insight:', error);
        throw error;
    }

    return data;
}

export async function markInsightAsRead(id: string) {
    const { error } = await supabase
        .from('ai_insights')
        .update({ read: true })
        .eq('id', id);

    if (error) {
        console.error('Error marking insight as read:', error);
        throw error;
    }
}

// === ЧЕЛЛЕНДЖИ ===
export async function getChallenges(userId: string): Promise<Challenge[]> {
    console.log('🔵 [getChallenges] Fetching challenges for userId:', userId);
    const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ [getChallenges] Error fetching challenges:', error);
        return [];
    }

    console.log('🔵 [getChallenges] Raw data from Supabase:', data?.length, 'challenges');

    return data.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        targetCategory: c.target_category as any,
        targetAmount: c.target_amount ? Number(c.target_amount) : undefined,
        duration: c.duration,
        startDate: new Date(c.start_date),
        endDate: new Date(c.end_date),
        progress: Number(c.progress || 0),
        streak: Number(c.streak || 0),
        completed: c.completed || false,
        badge: undefined, // TODO: Join with badges table
    }));
}

export async function createChallenge(
    userId: string,
    challenge: Omit<Challenge, 'id' | 'progress' | 'streak' | 'completed'>
) {
    const { data, error } = await supabase
        .from('challenges')
        .insert({
            user_id: userId,
            title: challenge.title,
            description: challenge.description,
            type: challenge.type,
            target_category: challenge.targetCategory,
            target_amount: challenge.targetAmount,
            duration: challenge.duration,
            start_date: challenge.startDate.toISOString(),
            end_date: challenge.endDate.toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating challenge:', error);
        throw error;
    }

    return data;
}

export async function updateChallenge(id: string, updates: Partial<Challenge>) {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.streak !== undefined) updateData.streak = updates.streak;
    if (updates.completed !== undefined) updateData.completed = updates.completed;

    const { data, error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating challenge:', error);
        throw error;
    }

    return data;
}

export async function deleteChallenge(id: string) {
    const { error } = await supabase.from('challenges').delete().eq('id', id);

    if (error) {
        console.error('Error deleting challenge:', error);
        throw error;
    }
}

// === БЕЙДЖИ ===
export async function getBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

    if (error) {
        console.error('Error fetching badges:', error);
        return [];
    }

    return data.map((b) => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        description: b.description,
        category: b.category as any,
        earnedAt: b.earned_at ? new Date(b.earned_at) : undefined,
    }));
}

export async function awardBadge(userId: string, badge: Omit<Badge, 'id'>) {
    const { data, error } = await supabase
        .from('badges')
        .insert({
            user_id: userId,
            name: badge.name,
            icon: badge.icon,
            description: badge.description,
            category: badge.category,
        })
        .select()
        .single();

    if (error) {
        console.error('Error awarding badge:', error);
        throw error;
    }

    return data;
}

// === АНОМАЛИИ ===
export async function getAnomalyAlerts(userId: string): Promise<AnomalyAlert[]> {
    const { data, error } = await supabase
        .from('anomaly_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching anomaly alerts:', error);
        return [];
    }

    return data.map((a) => ({
        id: a.id,
        transactionId: a.transaction_id || '',
        type: a.type,
        severity: a.severity,
        message: a.message,
        suggestion: a.suggestion,
        date: new Date(a.date),
        dismissed: a.dismissed || false,
    }));
}

export async function createAnomalyAlert(
    userId: string,
    alert: Omit<AnomalyAlert, 'id' | 'dismissed'>
) {
    const { data, error } = await supabase
        .from('anomaly_alerts')
        .insert({
            user_id: userId,
            transaction_id: alert.transactionId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            suggestion: alert.suggestion,
            date: formatDateForDB(alert.date),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating anomaly alert:', error);
        throw error;
    }

    return data;
}

export async function dismissAnomalyAlert(id: string) {
    const { error } = await supabase
        .from('anomaly_alerts')
        .update({ dismissed: true })
        .eq('id', id);

    if (error) {
        console.error('Error dismissing anomaly alert:', error);
        throw error;
    }
}

// === ИГРОВАЯ СТАТИСТИКА ===
export async function getGameStats(userId: string): Promise<GameStats | null> {
    const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // PGRST116 = запись не найдена, это нормально для нового пользователя
        if (error.code === 'PGRST116') {
            console.log('ℹ️ Game stats not found for user, will be created on first transaction');
            return null;
        }
        console.error('Error fetching game stats:', error);
        return null;
    }

    if (!data) return null;

    const badges = await getBadges(userId);
    const challenges = await getChallenges(userId);

    return {
        totalPoints: Number(data.total_points || 0),
        level: Number(data.level || 1),
        badges,
        activeChallenges: challenges.filter((c) => !c.completed),
        completedChallenges: challenges.filter((c) => c.completed),
        longestStreak: Number(data.longest_streak || 0),
        currentStreak: Number(data.current_streak || 0),
    };
}

export async function updateGameStats(
    userId: string,
    updates: Partial<GameStats>
) {
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.totalPoints !== undefined)
        updateData.total_points = updates.totalPoints;
    if (updates.level !== undefined) updateData.level = updates.level;
    if (updates.longestStreak !== undefined)
        updateData.longest_streak = updates.longestStreak;
    if (updates.currentStreak !== undefined)
        updateData.current_streak = updates.currentStreak;

    const { data, error } = await supabase
        .from('game_stats')
        .upsert({
            user_id: userId,
            ...updateData,
        })
        .select()
        .single();

    if (error) {
        console.error('Error updating game stats:', error);
        throw error;
    }

    return data;
}

// === НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ ===
export async function getUserSettings(
    userId: string
): Promise<AppSettings | null> {
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('currency, locale')
        .eq('id', userId)
        .single();

    if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
    }

    const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching user settings:', settingsError);
    }

    if (!settingsData || !userData) {
        console.log('ℹ️ User settings not found, using defaults');
        return null;
    }

    return {
        currency: userData.currency || 'KZT',
        locale: userData.locale || 'ru-RU',
        theme: (settingsData.theme as 'dark' | 'light') || 'dark',
        biometricLockEnabled: settingsData.biometric_lock_enabled || false,
        notifications: {
            enabled: settingsData.notifications_enabled || true,
            monthlyBudget: settingsData.notify_monthly_budget || true,
            goalProgress: settingsData.notify_goal_progress || true,
            challenges: settingsData.notify_challenges || true,
            insights: settingsData.notify_insights || true,
            recurringReminders: settingsData.notify_recurring_reminders || true,
        },
        privacy: {
            aiCategorization: settingsData.ai_categorization || true,
            aiPredictions: settingsData.ai_predictions || true,
            aiCoaching: settingsData.ai_coaching || true,
            anonymousComparison: settingsData.anonymous_comparison || false,
            dataExportEnabled: settingsData.data_export_enabled || true,
        },
    };
}

export async function updateUserSettings(
    userId: string,
    updates: Partial<AppSettings>
) {
    const settingsUpdate: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.theme !== undefined) settingsUpdate.theme = updates.theme;
    if (updates.biometricLockEnabled !== undefined)
        settingsUpdate.biometric_lock_enabled = updates.biometricLockEnabled;
    if (updates.notifications) {
        if (updates.notifications.enabled !== undefined)
            settingsUpdate.notifications_enabled = updates.notifications.enabled;
        if (updates.notifications.monthlyBudget !== undefined)
            settingsUpdate.notify_monthly_budget = updates.notifications.monthlyBudget;
        if (updates.notifications.goalProgress !== undefined)
            settingsUpdate.notify_goal_progress = updates.notifications.goalProgress;
        if (updates.notifications.challenges !== undefined)
            settingsUpdate.notify_challenges = updates.notifications.challenges;
        if (updates.notifications.insights !== undefined)
            settingsUpdate.notify_insights = updates.notifications.insights;
        if (updates.notifications.recurringReminders !== undefined)
            settingsUpdate.notify_recurring_reminders =
                updates.notifications.recurringReminders;
    }

    if (updates.privacy) {
        if (updates.privacy.aiCategorization !== undefined)
            settingsUpdate.ai_categorization = updates.privacy.aiCategorization;
        if (updates.privacy.aiPredictions !== undefined)
            settingsUpdate.ai_predictions = updates.privacy.aiPredictions;
        if (updates.privacy.aiCoaching !== undefined)
            settingsUpdate.ai_coaching = updates.privacy.aiCoaching;
        if (updates.privacy.anonymousComparison !== undefined)
            settingsUpdate.anonymous_comparison = updates.privacy.anonymousComparison;
        if (updates.privacy.dataExportEnabled !== undefined)
            settingsUpdate.data_export_enabled = updates.privacy.dataExportEnabled;
    }

    // Обновляем настройки
    await supabase
        .from('user_settings')
        .upsert({
            user_id: userId,
            ...settingsUpdate,
        });

    // Обновляем валюту и локаль в таблице users
    if (updates.currency || updates.locale) {
        const userUpdate: any = {};
        if (updates.currency) userUpdate.currency = updates.currency;
        if (updates.locale) userUpdate.locale = updates.locale;

        await supabase.from('users').update(userUpdate).eq('id', userId);
    }
}

// === СИНХРОНИЗАЦИЯ ВСЕХ ДАННЫХ ===
export async function syncAllData(userId: string) {
    try {
        const [
            transactions,
            budgets,
            goals,
            insights,
            challenges,
            badges,
            anomalyAlerts,
            gameStats,
            settings,
        ] = await Promise.all([
            getTransactions(userId),
            getBudgets(userId),
            getGoals(userId),
            getInsights(userId),
            getChallenges(userId),
            getBadges(userId),
            getAnomalyAlerts(userId),
            getGameStats(userId),
            getUserSettings(userId),
        ]);

        return {
            transactions,
            budgets,
            goals,
            insights,
            challenges,
            badges,
            anomalyAlerts,
            gameStats,
            settings,
        };
    } catch (error) {
        console.error('Error syncing all data:', error);
        throw error;
    }
}
