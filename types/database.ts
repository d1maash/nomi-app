// Типы для Supabase базы данных
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          name: string | null;
          currency: string | null;
          locale: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          name?: string | null;
          currency?: string | null;
          locale?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          name?: string | null;
          currency?: string | null;
          locale?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          description: string;
          date: string;
          type: 'expense' | 'income';
          ai_suggested: boolean | null;
          tags: string[] | null;
          recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          recurring_next_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          description: string;
          date: string;
          type: 'expense' | 'income';
          ai_suggested?: boolean | null;
          tags?: string[] | null;
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          recurring_next_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string;
          date?: string;
          type?: 'expense' | 'income';
          ai_suggested?: boolean | null;
          tags?: string[] | null;
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          recurring_next_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          limit_amount: number;
          spent: number | null;
          period: 'weekly' | 'monthly';
          start_date: string;
          end_date: string;
          ai_predicted_spend: number | null;
          ai_confidence: number | null;
          ai_recommendation: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          limit_amount: number;
          spent?: number | null;
          period: 'weekly' | 'monthly';
          start_date: string;
          end_date: string;
          ai_predicted_spend?: number | null;
          ai_confidence?: number | null;
          ai_recommendation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          limit_amount?: number;
          spent?: number | null;
          period?: 'weekly' | 'monthly';
          start_date?: string;
          end_date?: string;
          ai_predicted_spend?: number | null;
          ai_confidence?: number | null;
          ai_recommendation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number | null;
          deadline: string;
          category: string;
          ai_estimated_date: string | null;
          ai_recommended_weekly_saving: number | null;
          ai_risk_level: 'low' | 'medium' | 'high' | null;
          ai_note: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number | null;
          deadline: string;
          category: string;
          ai_estimated_date?: string | null;
          ai_recommended_weekly_saving?: number | null;
          ai_risk_level?: 'low' | 'medium' | 'high' | null;
          ai_note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number | null;
          deadline?: string;
          category?: string;
          ai_estimated_date?: string | null;
          ai_recommended_weekly_saving?: number | null;
          ai_risk_level?: 'low' | 'medium' | 'high' | null;
          ai_note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          type: 'coaching' | 'anomaly' | 'prediction' | 'comparison';
          title: string;
          message: string;
          actionable: string;
          priority: 'low' | 'medium' | 'high';
          category: string | null;
          date: string;
          read: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'coaching' | 'anomaly' | 'prediction' | 'comparison';
          title: string;
          message: string;
          actionable: string;
          priority: 'low' | 'medium' | 'high';
          category?: string | null;
          date?: string;
          read?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'coaching' | 'anomaly' | 'prediction' | 'comparison';
          title?: string;
          message?: string;
          actionable?: string;
          priority?: 'low' | 'medium' | 'high';
          category?: string | null;
          date?: string;
          read?: boolean | null;
          created_at?: string | null;
        };
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          type: 'spending' | 'saving' | 'category';
          target_category: string | null;
          target_amount: number | null;
          duration: number;
          start_date: string;
          end_date: string;
          progress: number | null;
          streak: number | null;
          completed: boolean | null;
          badge_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          type: 'spending' | 'saving' | 'category';
          target_category?: string | null;
          target_amount?: number | null;
          duration: number;
          start_date: string;
          end_date: string;
          progress?: number | null;
          streak?: number | null;
          completed?: boolean | null;
          badge_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          type?: 'spending' | 'saving' | 'category';
          target_category?: string | null;
          target_amount?: number | null;
          duration?: number;
          start_date?: string;
          end_date?: string;
          progress?: number | null;
          streak?: number | null;
          completed?: boolean | null;
          badge_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      badges: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          description: string;
          category: string;
          earned_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          description: string;
          category: string;
          earned_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          description?: string;
          category?: string;
          earned_at?: string | null;
          created_at?: string | null;
        };
      };
      anomaly_alerts: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          type: 'unusual_amount' | 'duplicate' | 'unusual_location' | 'unusual_time';
          severity: 'low' | 'medium' | 'high';
          message: string;
          suggestion: string;
          date: string;
          dismissed: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          type: 'unusual_amount' | 'duplicate' | 'unusual_location' | 'unusual_time';
          severity: 'low' | 'medium' | 'high';
          message: string;
          suggestion: string;
          date?: string;
          dismissed?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_id?: string | null;
          type?: 'unusual_amount' | 'duplicate' | 'unusual_location' | 'unusual_time';
          severity?: 'low' | 'medium' | 'high';
          message?: string;
          suggestion?: string;
          date?: string;
          dismissed?: boolean | null;
          created_at?: string | null;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'dark' | 'light' | null;
          biometric_lock_enabled: boolean | null;
          notifications_enabled: boolean | null;
          notify_monthly_budget: boolean | null;
          notify_goal_progress: boolean | null;
          notify_challenges: boolean | null;
          notify_insights: boolean | null;
          notify_recurring_reminders: boolean | null;
          ai_categorization: boolean | null;
          ai_predictions: boolean | null;
          ai_coaching: boolean | null;
          anonymous_comparison: boolean | null;
          data_export_enabled: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'dark' | 'light' | null;
          biometric_lock_enabled?: boolean | null;
          notifications_enabled?: boolean | null;
          notify_monthly_budget?: boolean | null;
          notify_goal_progress?: boolean | null;
          notify_challenges?: boolean | null;
          notify_insights?: boolean | null;
          notify_recurring_reminders?: boolean | null;
          ai_categorization?: boolean | null;
          ai_predictions?: boolean | null;
          ai_coaching?: boolean | null;
          anonymous_comparison?: boolean | null;
          data_export_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'dark' | 'light' | null;
          biometric_lock_enabled?: boolean | null;
          notifications_enabled?: boolean | null;
          notify_monthly_budget?: boolean | null;
          notify_goal_progress?: boolean | null;
          notify_challenges?: boolean | null;
          notify_insights?: boolean | null;
          notify_recurring_reminders?: boolean | null;
          ai_categorization?: boolean | null;
          ai_predictions?: boolean | null;
          ai_coaching?: boolean | null;
          anonymous_comparison?: boolean | null;
          data_export_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      game_stats: {
        Row: {
          id: string;
          user_id: string;
          total_points: number | null;
          level: number | null;
          longest_streak: number | null;
          current_streak: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_points?: number | null;
          level?: number | null;
          longest_streak?: number | null;
          current_streak?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_points?: number | null;
          level?: number | null;
          longest_streak?: number | null;
          current_streak?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

