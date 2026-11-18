import { getUserDb } from './database';

export interface NotificationSettings {
  devotionalEnabled: boolean;
  devotionalHour: number;
  devotionalMinute: number;
  bibleEnabled: boolean;
  bibleHour: number;
  bibleMinute: number;
  prayerEnabled: boolean;
  prayerHour: number;
  prayerMinute: number;
  sound: boolean;
  vibration: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  preferredSound: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  devotionalEnabled: false,
  devotionalHour: 7,
  devotionalMinute: 0,
  bibleEnabled: false,
  bibleHour: 7,
  bibleMinute: 0,
  prayerEnabled: false,
  prayerHour: 7,
  prayerMinute: 0,
  sound: true,
  vibration: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  preferredSound: 'default',
};

export function parseTime24(value: string | null | undefined): { hour: number; minute: number } {
  if (!value) return { hour: 7, minute: 0 };
  const parts = String(value).split(':').map((n) => parseInt(n, 10));
  const hour = Number.isFinite(parts[0]) ? Math.min(23, Math.max(0, parts[0])) : 7;
  const minute = Number.isFinite(parts[1]) ? Math.min(59, Math.max(0, parts[1])) : 0;
  return { hour, minute };
}

export function formatTime24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getNotificationSettings(): NotificationSettings {
  const db = getUserDb();
  const row: any = db.getFirstSync('SELECT * FROM notification_settings WHERE id = 1');
  if (!row) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  const dev = parseTime24(row.devotional_time);
  const bible = parseTime24(row.bible_time);
  const prayer = parseTime24(row.prayer_time);
  return {
    devotionalEnabled: !!row.devotional_enabled,
    devotionalHour: dev.hour,
    devotionalMinute: dev.minute,
    bibleEnabled: !!row.bible_enabled,
    bibleHour: bible.hour,
    bibleMinute: bible.minute,
    prayerEnabled: !!row.prayer_enabled,
    prayerHour: prayer.hour,
    prayerMinute: prayer.minute,
    sound: !!row.sound,
    vibration: !!row.vibration,
    quietHoursStart: row.quiet_hours_start || null,
    quietHoursEnd: row.quiet_hours_end || null,
    preferredSound: row.preferred_sound || 'default',
  };
}

export function setNotificationSettings(settings: NotificationSettings): void {
  const db = getUserDb();
  db.runSync(
    `INSERT INTO notification_settings (
       id, devotional_enabled, devotional_time, bible_enabled, bible_time,
       prayer_enabled, prayer_time, sound, vibration, quiet_hours_start, quiet_hours_end, preferred_sound)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       devotional_enabled = excluded.devotional_enabled,
       devotional_time = excluded.devotional_time,
       bible_enabled = excluded.bible_enabled,
       bible_time = excluded.bible_time,
       prayer_enabled = excluded.prayer_enabled,
       prayer_time = excluded.prayer_time,
       sound = excluded.sound,
       vibration = excluded.vibration,
       quiet_hours_start = excluded.quiet_hours_start,
       quiet_hours_end = excluded.quiet_hours_end,
       preferred_sound = excluded.preferred_sound`,
    [
      settings.devotionalEnabled ? 1 : 0,
      formatTime24(settings.devotionalHour, settings.devotionalMinute),
      settings.bibleEnabled ? 1 : 0,
      formatTime24(settings.bibleHour, settings.bibleMinute),
      settings.prayerEnabled ? 1 : 0,
      formatTime24(settings.prayerHour, settings.prayerMinute),
      settings.sound ? 1 : 0,
      settings.vibration ? 1 : 0,
      settings.quietHoursStart,
      settings.quietHoursEnd,
      settings.preferredSound,
    ]
  );
}
