import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Сервис локальных уведомлений
 * 
 * Примечание: В Expo Go (SDK 53+) удалена поддержка push-уведомлений (remote notifications).
 * Локальные уведомления (scheduleNotificationAsync) продолжают работать.
 * Для полной поддержки push-уведомлений используйте development build.
 */

// Проверка, запущено ли приложение в Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Конфигурация поведения уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Запрос разрешений на уведомления
   */
  async requestPermissions(): Promise<boolean> {
    // В Expo Go локальные уведомления работают, но с ограничениями
    if (isExpoGo) {
      console.warn(
        'Уведомления: Приложение запущено в Expo Go. ' +
        'Локальные уведомления работают, но push-уведомления недоступны. ' +
        'Для полной поддержки используйте development build.'
      );
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B7FD7',
      });
    }

    return finalStatus === 'granted';
  }

  /**
   * Проверка разрешений
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Запланировать уведомление
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {},
        },
        trigger,
      });
    } catch (error) {
      if (isExpoGo) {
        console.warn('Не удалось запланировать уведомление в Expo Go:', error);
      }
      throw error;
    }
  }

  /**
   * Ежедневное напоминание в определённое время
   */
  async scheduleDailyReminder(
    title: string,
    body: string,
    hour: number,
    minute: number
  ): Promise<string> {
    return await this.scheduleNotification(title, body, {
      hour,
      minute,
      repeats: true,
    });
  }

  /**
   * Уведомление о начале месяца (Smart-бюджет)
   */
  async scheduleMonthlyBudgetNotification(): Promise<string> {
    return await this.scheduleNotification(
      'Готов твой Smart-бюджет',
      'Проверь прогноз и рекомендации на новый месяц',
      {
        day: 1,
        hour: 9,
        minute: 0,
        repeats: true,
      }
    );
  }

  /**
   * Уведомление о прогрессе по цели
   */
  async scheduleGoalProgressNotification(
    goalName: string,
    progress: number
  ): Promise<string> {
    return await this.scheduleNotification(
      `Прогресс по цели "${goalName}"`,
      `Ты уже накопил ${progress}%! Так держать!`,
      {
        seconds: 2,
      }
    );
  }

  /**
   * Уведомление о близости к лимиту бюджета
   */
  async scheduleBudgetWarning(category: string, percentage: number): Promise<string> {
    return await this.scheduleNotification(
      'Внимание к бюджету',
      `Бюджет на ${category} использован на ${percentage}%`,
      {
        seconds: 2,
      }
    );
  }

  /**
   * Отменить уведомление
   */
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Отменить все уведомления
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Получить все запланированные уведомления
   */
  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export const notificationService = new NotificationService();

