import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { extractOAuthTokensFromUrl } from '@/utils/oauth';

// Убедимся, что Expo корректно завершает auth session,
// если deep link вернул управление в приложение
WebBrowser.maybeCompleteAuthSession();

type UserProfile = Database['public']['Tables']['users']['Row'];

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    options?: {
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Database['public']['Tables']['users']['Update']) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Загрузка профиля пользователя
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  // Инициализация и подписка на изменения сессии
  useEffect(() => {
    let mounted = true;

    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        }
        setLoading(false);
      }
    });

    // Подписываемся на изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Вход через email и пароль
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error);
      return { error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    }
  };

  // Регистрация через email и пароль
  const signUpWithEmail = async (
    email: string,
    password: string,
    options?: {
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ) => {
    try {
      setError(null);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: options?.username,
            first_name: options?.firstName,
            last_name: options?.lastName,
          },
        },
      });

      if (error) {
        setError(error);
        return { error };
      }

      // Обновляем профиль после регистрации, если есть дополнительные данные
      if (data.user && options) {
        const updates: Database['public']['Tables']['users']['Update'] = {};
        if (options.username) updates.username = options.username;
        if (options.firstName) updates.first_name = options.firstName;
        if (options.lastName) updates.last_name = options.lastName;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('users')
            .update(updates)
            .eq('id', data.user.id);
        }
      }

      return { error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    }
  };

  // Вход через Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      
      const isNative = Platform.OS !== 'web';

      // Для React Native используем deep link, для web - абсолютный URL
      const redirectUrl = isNative
        ? 'nomiapp://auth/callback'
        : (typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : 'nomiapp://auth/callback');
      
      console.log('[Auth] Starting Google OAuth with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative, // На native обрабатываем редирект самостоятельно
        },
      });
      
      if (error) {
        console.error('[Auth] Google OAuth error:', error);
        setError(error);
        return { error };
      }

      if (isNative) {
        if (!data?.url) {
          console.error('[Auth] Missing OAuth URL for native flow');
          const noUrlError = new AuthError('Не удалось получить OAuth URL');
          setError(noUrlError);
          return { error: noUrlError };
        }

        console.log('[Auth] Opening in-app browser for Google OAuth');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success') {
          if (!result.url) {
            const emptyUrlError = new AuthError('Пустой ответ от OAuth провайдера');
            setError(emptyUrlError);
            return { error: emptyUrlError };
          }

          const tokens = extractOAuthTokensFromUrl(result.url);

          if (tokens) {
            console.log('[Auth] OAuth tokens received, saving session');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            });

            if (sessionError) {
              console.error('[Auth] Error storing OAuth session:', sessionError);
              setError(sessionError);
              return { error: sessionError };
            }

            console.log('[Auth] OAuth session stored successfully');
          } else {
            console.warn('[Auth] No OAuth tokens found in redirect URL');
          }
        } else if (result.type === 'cancel') {
          const cancelError = new AuthError('Авторизация отменена');
          setError(cancelError);
          return { error: cancelError };
        } else if (result.type === 'dismiss') {
          const dismissError = new AuthError('Авторизация прервана');
          setError(dismissError);
          return { error: dismissError };
        } else {
          const lockedError = new AuthError('OAuth окно уже открыто или заблокировано');
          setError(lockedError);
          return { error: lockedError };
        }
      }
      
      // В React Native OAuth URL открывается в браузере
      // После авторизации Google перенаправит на redirectUrl
      // Deep linking вернет пользователя в приложение
      // Callback страница обработает токены
      
      console.log('[Auth] Google OAuth started, waiting for callback...');
      return { error: null };
    } catch (err) {
      console.error('[Auth] Google OAuth exception:', err);
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    }
  };

  // Выход
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) setError(error);
      return { error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    }
  };

  // Обновление профиля
  const updateProfile = async (updates: Database['public']['Tables']['users']['Update']) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Обновляем локальный профиль
      await loadProfile(user.id);

      return { error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err as Error };
    }
  };

  // Обновление профиля
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return {
    session,
    user,
    profile,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };
}

// Хук для входа через username или email
export function useAuthWithUsername() {
  const auth = useAuth();

  const signInWithUsernameOrEmail = async (usernameOrEmail: string, password: string) => {
    try {
      // Сначала проверяем, это email или username
      const isEmail = usernameOrEmail.includes('@');

      if (isEmail) {
        // Если это email, входим напрямую
        return await auth.signInWithEmail(usernameOrEmail, password);
      }

      // Если это username, ищем email по username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', usernameOrEmail)
        .single();

      if (userError || !userData) {
        return {
          error: {
            message: 'Пользователь с таким никнеймом не найден',
            status: 404,
          } as AuthError,
        };
      }

      // Входим с найденным email
      return await auth.signInWithEmail(userData.email, password);
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  return {
    ...auth,
    signInWithUsernameOrEmail,
  };
}
