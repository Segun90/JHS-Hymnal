import { getDevotionalsDb, getUserDb } from './database';
import type { Devotional, DevotionProgress, DevotionalProgress } from '../types';

export function getDevotional(position: number): Devotional | null {
  if (position < 1) return null;
  return getDevotionalByOrder(position - 1);
}

export function getDevotionalsCount(): number {
  const db = getDevotionalsDb();
  const row: any = db.getFirstSync('SELECT COUNT(*) as c FROM devotionals');
  return row?.c ?? 0;
}

export function getAllDevotionalDays(): number[] {
  const count = getDevotionalsCount();
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getDevotionalByOrder(orderIndex: number): Devotional | null {
  const db = getDevotionalsDb();
  const rows: any[] = db.getAllSync(
    `SELECT day, title, scripture, memory_verse, devotional, prayer, reflection, action_point, tags, metadata
     FROM devotionals ORDER BY day LIMIT 1 OFFSET ?`,
    [orderIndex]
  );
  const row = rows[0];
  return row ? mapDevotional(row) : null;
}

function mapDevotional(r: any): Devotional {
  return {
    day: r.day,
    title: r.title,
    scripture: r.scripture,
    memoryVerse: r.memory_verse,
    devotional: r.devotional,
    prayer: r.prayer,
    reflection: r.reflection ?? '',
    actionPoint: r.action_point ?? '',
    tags: r.tags ?? '[]',
    metadata: r.metadata ?? null,
  };
}

export function getProgress(position: number): DevotionProgress {
  const db = getUserDb();
  const p: any = db.getFirstSync(
    'SELECT day, completed_at, note, prayer, updated_at FROM devotion_notes WHERE day = ?',
    [position]
  );
  if (!p) return { day: position, completedAt: null, notes: '', prayerJournal: '' };
  return {
    day: position,
    completedAt: p.completed_at,
    notes: p.note ?? '',
    prayerJournal: p.prayer ?? '',
  };
}

export function setCompleted(position: number, completed: boolean): void {
  const db = getUserDb();
  if (completed) {
    db.runSync(
      `INSERT INTO devotion_notes (day, note, prayer, updated_at, completed_at)
       VALUES (?, '', '', ?, ?)
       ON CONFLICT(day) DO UPDATE SET completed_at = excluded.completed_at, updated_at = excluded.updated_at`,
      [position, Date.now(), Date.now()]
    );
  } else {
    db.runSync('UPDATE devotion_notes SET completed_at = NULL, updated_at = ? WHERE day = ?', [Date.now(), position]);
  }
}

export function saveDayNote(position: number, note: string): void {
  const db = getUserDb();
  db.runSync(
    `INSERT INTO devotion_notes (day, note, prayer, updated_at, completed_at)
     VALUES (?, ?, '', ?, NULL)
     ON CONFLICT(day) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
    [position, note, Date.now()]
  );
}

export function saveDayPrayer(position: number, prayer: string): void {
  const db = getUserDb();
  db.runSync(
    `INSERT INTO devotion_notes (day, note, prayer, updated_at, completed_at)
     VALUES (?, '', ?, ?, NULL)
     ON CONFLICT(day) DO UPDATE SET prayer = excluded.prayer, updated_at = excluded.updated_at`,
    [position, prayer, Date.now()]
  );
}

export function getCompletedDays(): number[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    'SELECT day FROM devotion_notes WHERE completed_at IS NOT NULL ORDER BY day'
  );
  return rows.map((r) => r.day);
}

export function getAllProgress(): DevotionProgress[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    'SELECT day, completed_at, note, prayer, updated_at FROM devotion_notes ORDER BY day'
  );
  return rows.map((r) => ({
    day: r.day,
    completedAt: r.completed_at,
    notes: r.note ?? '',
    prayerJournal: r.prayer ?? '',
  }));
}

function epochDay(d: Date = new Date()): number {
  return Math.floor(d.getTime() / 86400000);
}

function mapProgress(r: any, today: number): DevotionalProgress {
  const lastCompletedDate = r.last_completed_date;
  return {
    currentDay: r.current_day,
    lastCompletedDay: r.last_completed_day,
    lastCompletedDate,
    lastReadDate: r.last_read_date,
    installDate: r.install_date,
    currentStreak: r.current_streak ?? 0,
    longestStreak: r.longest_streak ?? 0,
    completedToday: lastCompletedDate === today,
    hasCurrent: r.current_day != null,
  };
}

export function getOrCreateProgress(): DevotionalProgress {
  const db = getUserDb();
  let row: any = db.getFirstSync('SELECT * FROM devotional_progress WHERE id = 1');
  if (!row) {
    const count = getDevotionalsCount();
    const today = epochDay();
    db.runSync(
      `INSERT INTO devotional_progress
         (id, current_day, last_completed_day, last_completed_date, last_read_date, install_date, current_streak, longest_streak)
       VALUES (1, ?, NULL, NULL, ?, ?, 0, 0)`,
      [count > 0 ? 1 : null, today, Date.now()]
    );
    row = db.getFirstSync('SELECT * FROM devotional_progress WHERE id = 1');
  }
  return mapProgress(row, epochDay());
}

export function getDevotionalProgress(): DevotionalProgress {
  const db = getUserDb();
  const row: any = db.getFirstSync('SELECT * FROM devotional_progress WHERE id = 1');
  if (!row) return getOrCreateProgress();

  const today = epochDay();
  const lastRead = row.last_read_date;
  const currentDay = row.current_day;

  if (currentDay != null && lastRead != null && today > lastRead) {
    const count = getDevotionalsCount();
    const daysPassed = today - lastRead;
    let newDay = currentDay + daysPassed;
    if (newDay > count) newDay = count;

    if (newDay !== currentDay) {
      db.runSync(
        'UPDATE devotional_progress SET current_day = ?, last_read_date = ? WHERE id = 1',
        [newDay, today]
      );
      const updated: any = db.getFirstSync('SELECT * FROM devotional_progress WHERE id = 1');
      return mapProgress(updated, today);
    }
  }

  return mapProgress(row, today);
}

export function getCurrentDay(): number {
  return getDevotionalProgress().currentDay ?? 0;
}

export function markDayCompleted(position: number): { isLast: boolean } {
  setCompleted(position, true);
  const db = getUserDb();
  const p = getOrCreateProgress();
  const today = epochDay();
  const count = getDevotionalsCount();
  const isLast = position >= count;

  let currentStreak = p.currentStreak;
  if (p.lastCompletedDate !== today) {
    currentStreak = p.lastCompletedDate === today - 1 ? p.currentStreak + 1 : 1;
  }
  const longestStreak = Math.max(p.longestStreak, currentStreak);

  db.runSync(
    `UPDATE devotional_progress
     SET current_day = ?, last_completed_day = ?, last_completed_date = ?,
         current_streak = ?, longest_streak = ?, last_read_date = ?
     WHERE id = 1`,
    [isLast ? null : position + 1, position, today, currentStreak, longestStreak, today]
  );
  return { isLast };
}

export function unmarkDayCompleted(position: number): void {
  setCompleted(position, false);
  const db = getUserDb();
  const completed = getCompletedDays();
  const count = getDevotionalsCount();
  let current: number | null = null;
  for (let i = 1; i <= count; i++) {
    if (!completed.includes(i)) {
      current = i;
      break;
    }
  }
  const lastCompletedDay = completed.length ? Math.max(...completed) : null;
  db.runSync(
    `UPDATE devotional_progress
     SET current_day = ?, last_completed_day = ?
     WHERE id = 1`,
    [current, lastCompletedDay]
  );
}

export function recordRead(position: number): void {
  const p = getOrCreateProgress();
  if (p.lastReadDate === epochDay()) return;
  const db = getUserDb();
  db.runSync('UPDATE devotional_progress SET last_read_date = ? WHERE id = 1', [epochDay()]);
}

export function getReminderSetting(): { enabled: boolean; hour: number; minute: number } {
  const db = getUserDb();
  const row: any = db.getFirstSync(
    "SELECT value FROM settings WHERE key = 'devotion_reminder'"
  );
  if (!row?.value) return { enabled: false, hour: 7, minute: 0 };
  try {
    return JSON.parse(row.value);
  } catch {
    return { enabled: false, hour: 7, minute: 0 };
  }
}

export function setReminderSetting(setting: { enabled: boolean; hour: number; minute: number }): void {
  const db = getUserDb();
  db.runSync(
    "INSERT INTO settings (key, value) VALUES ('devotion_reminder', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [JSON.stringify(setting)]
  );
}
