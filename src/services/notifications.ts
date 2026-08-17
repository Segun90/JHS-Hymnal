import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { getDevotionalProgress } from '../db/devotionals';
import {
  getNotificationSettings,
  parseTime24,
  type NotificationSettings,
} from '../db/notifications';

export const REMINDER_TYPES = ['devotional', 'bible', 'prayer'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const ACTION_READ_NOW = 'readNow';
export const ACTION_REMIND_15 = 'remind15';
export const ACTION_REMIND_30 = 'remind30';

const CATEGORY_ID = 'devotionalReminder';
const CATEGORY_ACTIONS: Notifications.NotificationAction[] = [
  {
    identifier: ACTION_READ_NOW,
    buttonTitle: 'Read Now',
    options: { opensAppToForeground: true },
  },
  {
    identifier: ACTION_REMIND_15,
    buttonTitle: 'In 15 Minutes',
    options: { opensAppToForeground: false },
  },
  {
    identifier: ACTION_REMIND_30,
    buttonTitle: 'In 30 Minutes',
    options: { opensAppToForeground: false },
  },
];

const CHANNELS = {
  sound: 'jhs-reminders-sound',
  vibrateOnly: 'jhs-reminders-vibrate-only',
  soundOnly: 'jhs-reminders-sound-only',
  silent: 'jhs-reminders-silent',
} as const;

const IDENTIFIERS: Record<ReminderType, string> = {
  devotional: 'devotional-reminder',
  bible: 'bible-reminder',
  prayer: 'prayer-reminder',
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const content = notification.request.content;
    const shouldPlaySound = Platform.OS === 'android' ? true : content.sound != null;
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

export async function ensureNotificationSetup(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNELS.sound, {
      name: 'J.H.S Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C00000',
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.vibrateOnly, {
      name: 'J.H.S Reminders (Silent)',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C00000',
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.soundOnly, {
      name: 'J.H.S Reminders (No Vibration)',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      enableVibrate: false,
      vibrationPattern: null,
      lightColor: '#C00000',
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.silent, {
      name: 'J.H.S Reminders (Quiet)',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
      vibrationPattern: null,
      lightColor: '#C00000',
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, CATEGORY_ACTIONS, {});
}

export async function requestExactAlarmAccess(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 34) return;
  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
  } catch (e) {
    console.warn('Unable to open exact alarm settings:', e);
  }
}

function formatTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function isInQuietHours(
  hour: number,
  minute: number,
  start: string | null,
  end: string | null
): boolean {
  if (!start || !end) return false;
  const s = parseTime24(start);
  const e = parseTime24(end);
  const now = hour * 60 + minute;
  const sMin = s.hour * 60 + s.minute;
  const eMin = e.hour * 60 + e.minute;
  if (sMin === eMin) return false;
  if (sMin < eMin) return now >= sMin && now < eMin;
  return now >= sMin || now < eMin;
}

export function reminderTime(
  type: ReminderType,
  settings: NotificationSettings
): { hour: number; minute: number } {
  if (type === 'devotional') return { hour: settings.devotionalHour, minute: settings.devotionalMinute };
  if (type === 'bible') return { hour: settings.bibleHour, minute: settings.bibleMinute };
  return { hour: settings.prayerHour, minute: settings.prayerMinute };
}

function devotionalMessage(hour: number, minute: number): { title: string; body: string; screen: string } {
  const progress = getDevotionalProgress();
  if (!progress.hasCurrent) {
    return {
      title: 'Congratulations',
      body: "You've completed the devotional collection. Watch for future devotional updates.",
      screen: '/devotions',
    };
  }
  if (progress.completedToday) {
    return {
      title: 'Great job',
      body: `We'll have your next devotional ready tomorrow at ${formatTime(hour, minute)}.`,
      screen: `/devotional/${progress.currentDay}`,
    };
  }
  return {
    title: "Today's Devotional",
    body: "May God speak to your heart today. Tap to begin today's reading.",
    screen: `/devotional/${progress.currentDay}`,
  };
}

function bibleMessage(): { title: string; body: string; screen: string } {
  return {
    title: 'Bible Reading',
    body: "Take a few quiet minutes with God's Word today. Tap to open your Bible.",
    screen: '/bible',
  };
}

function prayerMessage(): { title: string; body: string; screen: string } {
  return {
    title: 'Prayer Time',
    body: 'Lift your heart to God in prayer. Tap to begin your quiet time.',
    screen: '/devotions',
  };
}

function messageFor(type: ReminderType, hour: number, minute: number): { title: string; body: string; screen: string } {
  if (type === 'devotional') return devotionalMessage(hour, minute);
  if (type === 'bible') return bibleMessage();
  return prayerMessage();
}

function channelFor(sound: boolean, vibration: boolean, quiet: boolean): string {
  if (quiet) return CHANNELS.silent;
  if (sound && vibration) return CHANNELS.sound;
  if (sound) return CHANNELS.soundOnly;
  if (vibration) return CHANNELS.vibrateOnly;
  return CHANNELS.silent;
}

export async function cancelReminder(type: ReminderType): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS[type]);
  } catch {}
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all(REMINDER_TYPES.map((t) => cancelReminder(t)));
}

export async function scheduleReminder(type: ReminderType, settings: NotificationSettings): Promise<void> {
  await ensureNotificationSetup();
  await cancelReminder(type);
  const { hour, minute } = reminderTime(type, settings);
  const quiet = isInQuietHours(hour, minute, settings.quietHoursStart, settings.quietHoursEnd);
  const message = messageFor(type, hour, minute);
  const playSound = settings.sound && !quiet;
  await Notifications.requestPermissionsAsync();
  const content: Notifications.NotificationContentInput = {
    title: message.title,
    body: message.body,
    data: { screen: message.screen, type },
  };
  if (Platform.OS !== 'android') {
    content.sound = playSound ? 'default' : false;
  }
  if (type === 'devotional') {
    content.categoryIdentifier = CATEGORY_ID;
  }
  if (Platform.OS === 'android') {
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIERS[type],
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: channelFor(settings.sound, settings.vibration, quiet),
      },
    });
  } else {
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIERS[type],
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function sendTestNotification(): Promise<void> {
  await ensureNotificationSetup();
  await Notifications.requestPermissionsAsync();
  await Notifications.scheduleNotificationAsync({
    identifier: 'test-notification',
    content: {
      title: "Today's Devotional",
      body: "May God speak to your heart today. Tap to begin today's reading.",
      data: { screen: '/devotions', type: 'devotional' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: CHANNELS.sound,
    },
  });
}

export async function scheduleSnooze(minutes: number): Promise<void> {
  await ensureNotificationSetup();
  const settings = getNotificationSettings();
  const { title, body, screen } = devotionalMessage(
    settings.devotionalHour,
    settings.devotionalMinute
  );
  await Notifications.requestPermissionsAsync();
  const content: Notifications.NotificationContentInput = {
    title,
    body,
    data: { screen, type: 'devotional' },
    categoryIdentifier: CATEGORY_ID,
  };
  if (Platform.OS !== 'android') {
    content.sound = settings.sound ? 'default' : false;
  }
  if (Platform.OS === 'android') {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: channelFor(settings.sound, settings.vibration, false),
      },
    });
  } else {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
  }
}

export async function syncRemindersFromStore(): Promise<void> {
  await ensureNotificationSetup();
  const settings = getNotificationSettings();
  for (const type of REMINDER_TYPES) {
    if (type === 'devotional' && settings.devotionalEnabled) {
      await scheduleReminder(type, settings);
    } else if (type === 'bible' && settings.bibleEnabled) {
      await scheduleReminder(type, settings);
    } else if (type === 'prayer' && settings.prayerEnabled) {
      await scheduleReminder(type, settings);
    } else {
      await cancelReminder(type);
    }
  }
}
