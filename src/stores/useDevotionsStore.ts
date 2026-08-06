import { create } from 'zustand';
import {
  getDevotional, getCompletedDays, getAllDevotionalDays, getDevotionalsCount,
  setCompleted, getProgress, saveDayNote, saveDayPrayer,
  getOrCreateProgress, getDevotionalProgress, markDayCompleted, unmarkDayCompleted, recordRead,
} from '../db/devotionals';
import {
  getNotificationSettings,
  setNotificationSettings as persistNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '../db/notifications';
import { syncRemindersFromStore } from '../services/notifications';
import type { Devotional, DevotionProgress, DevotionalProgress } from '../types';

interface DevotionsState {
  hydrated: boolean;
  totalDays: number;
  todayDay: number;
  allDays: number[];
  completedDays: number[];
  notifications: NotificationSettings;
  progress: DevotionalProgress | null;
  hydrate: () => void;
  refreshProgress: () => void;
  getDayDevotional: (day: number) => Devotional | null;
  getDayProgress: (day: number) => DevotionProgress;
  toggleCompleted: (day: number) => boolean;
  markCompleted: (day: number) => { nextDay: number | null; isLast: boolean };
  saveNote: (day: number, note: string) => void;
  savePrayer: (day: number, prayer: string) => void;
  recordRead: (day: number) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  refreshNotifications: () => void;
}

function loadState() {
  const progress = getDevotionalProgress();
  return {
    progress,
    todayDay: progress.currentDay ?? 0,
    totalDays: getDevotionalsCount(),
    allDays: getAllDevotionalDays(),
    completedDays: getCompletedDays(),
    notifications: getNotificationSettings(),
  };
}

export const useDevotionsStore = create<DevotionsState>((set, get) => ({
  hydrated: false,
  totalDays: 0,
  todayDay: 0,
  allDays: [],
  completedDays: [],
  notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  progress: null,

  hydrate: () => {
    getOrCreateProgress();
    set({ ...loadState(), hydrated: true });
  },

  refreshProgress: () => {
    set(loadState());
  },

  getDayDevotional: (day) => getDevotional(day),

  getDayProgress: (day) => getProgress(day),

  toggleCompleted: (day) => {
    const progress = getProgress(day);
    const next = !progress.completedAt;
    if (next) {
      markDayCompleted(day);
    } else {
      unmarkDayCompleted(day);
    }
    set(loadState());
    return next;
  },

  markCompleted: (day) => {
    const { isLast } = markDayCompleted(day);
    set(loadState());
    if (get().notifications.devotionalEnabled) {
      syncRemindersFromStore().catch(() => {});
    }
    return { nextDay: get().todayDay || null, isLast };
  },

  saveNote: (day, note) => {
    saveDayNote(day, note);
    set({ completedDays: getCompletedDays() });
  },

  savePrayer: (day, prayer) => {
    saveDayPrayer(day, prayer);
  },

  recordRead: (day) => {
    recordRead(day);
    set(loadState());
  },

  setNotificationSettings: (settings) => {
    persistNotificationSettings(settings);
    set({ notifications: settings });
    syncRemindersFromStore().catch(() => {});
  },

  refreshNotifications: () => {
    set({ notifications: getNotificationSettings() });
  },
}));
