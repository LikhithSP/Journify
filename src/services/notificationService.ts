/**
 * Journify Notification Service
 * Manages:
 * - Daily writing reminders (scheduled time)
 * - Custom reminders (user defined time & custom message)
 * - Missed-journal check ("You haven't written today. Want to take 5 minutes?")
 * - Streak notifications (milestone celebration & streak protection)
 * - Browser Web Notifications API permission & fallback in-app alerts
 */

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: {
    enabled: boolean;
    time: string; // "20:00"
    message: string;
  };
  customReminder: {
    enabled: boolean;
    time: string; // "14:30"
    message: string;
  };
  missedJournalReminder: {
    enabled: boolean;
    cutoffHour: number; // e.g. 21 (9 PM)
    message: string;
  };
  streakNotifications: {
    enabled: boolean;
    milestones: number[]; // [3, 7, 14, 30, 100]
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminder: {
    enabled: true,
    time: '20:00',
    message: 'Time to reflect on your day in Journify 📖',
  },
  customReminder: {
    enabled: false,
    time: '14:00',
    message: 'Midday mindful check-in 🌿',
  },
  missedJournalReminder: {
    enabled: true,
    cutoffHour: 21,
    message: "You haven't written today. Want to take 5 minutes? ✨",
  },
  streakNotifications: {
    enabled: true,
    milestones: [3, 7, 14, 30, 60, 100],
  },
};

const STORAGE_KEY = 'journify_notification_settings';
const LAST_SENT_KEY = 'journify_notifications_last_sent';

export class NotificationService {
  private static checkInterval: any = null;

  public static getSettings(): NotificationSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  public static saveSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  public static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    return Notification.requestPermission();
  }

  public static hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  /**
   * Dispatches a notification (native OS banner with in-app sound or fallback)
   */
  public static trigger(title: string, options?: NotificationOptions): void {
    if (this.hasPermission()) {
      try {
        new Notification(title, {
          icon: '/journal.svg',
          badge: '/journal.svg',
          ...options,
        });
      } catch (e) {
        console.warn('Native notification failed, falling back:', e);
      }
    } else {
      // In-app fallback broadcast
      window.dispatchEvent(
        new CustomEvent('journify_inapp_notification', {
          detail: { title, body: options?.body || '' },
        })
      );
    }
  }

  /**
   * Evaluates reminders against current time and last-journaled date
   */
  public static evaluateReminders(
    lastEntryDate: string | null,
    currentStreak: number = 0
  ): void {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    const lastSentRaw = localStorage.getItem(LAST_SENT_KEY);
    const lastSent: Record<string, string> = lastSentRaw ? JSON.parse(lastSentRaw) : {};

    // 1. Daily Reminder
    if (settings.dailyReminder.enabled && currentTimeStr === settings.dailyReminder.time) {
      const sentKey = `daily_${todayStr}`;
      if (!lastSent[sentKey]) {
        this.trigger('Journify Daily Reminder', {
          body: settings.dailyReminder.message,
        });
        lastSent[sentKey] = now.toISOString();
      }
    }

    // 2. Custom Reminder
    if (settings.customReminder.enabled && currentTimeStr === settings.customReminder.time) {
      const sentKey = `custom_${todayStr}`;
      if (!lastSent[sentKey]) {
        this.trigger('Journify Reminder', {
          body: settings.customReminder.message,
        });
        lastSent[sentKey] = now.toISOString();
      }
    }

    // 3. Missed Journal Reminder
    // If cutoff hour reached (e.g. 9 PM) and user hasn't written today
    if (settings.missedJournalReminder.enabled && currentHour >= settings.missedJournalReminder.cutoffHour) {
      const sentKey = `missed_${todayStr}`;
      const wroteToday = lastEntryDate && lastEntryDate.startsWith(todayStr);

      if (!wroteToday && !lastSent[sentKey]) {
        this.trigger('Keep your habit going', {
          body: settings.missedJournalReminder.message,
        });
        lastSent[sentKey] = now.toISOString();
      }
    }

    // 4. Streak Notification
    if (settings.streakNotifications.enabled && currentStreak > 0) {
      if (settings.streakNotifications.milestones.includes(currentStreak)) {
        const sentKey = `streak_${currentStreak}_${todayStr}`;
        if (!lastSent[sentKey]) {
          this.trigger('🔥 Incredible Milestone!', {
            body: `You've maintained a ${currentStreak}-day journaling streak! Keep the momentum alive.`,
          });
          lastSent[sentKey] = now.toISOString();
        }
      }
    }

    try {
      localStorage.setItem(LAST_SENT_KEY, JSON.stringify(lastSent));
    } catch (e) {}
  }

  /**
   * Initializes periodic reminder background checker (runs every 60s)
   */
  public static startScheduler(
    getLastEntryDate: () => string | null,
    getCurrentStreak: () => number
  ): () => void {
    if (this.checkInterval) clearInterval(this.checkInterval);

    // Initial check
    this.evaluateReminders(getLastEntryDate(), getCurrentStreak());

    // Check once every minute
    this.checkInterval = setInterval(() => {
      this.evaluateReminders(getLastEntryDate(), getCurrentStreak());
    }, 60000);

    return () => {
      if (this.checkInterval) clearInterval(this.checkInterval);
    };
  }
}
