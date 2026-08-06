import { getUserDb, getBibleDb, getContentDb } from './database';

function getSetting(key: string): string | undefined {
  const db = getUserDb();
  const row = db.getFirstSync("SELECT value FROM settings WHERE key = ?", [key]) as any;
  return row?.value;
}

function setSetting(key: string, value: string): void {
  getUserDb().runSync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
}

// ─── Join Date ────────────────────────────────────────────────

export function getOrCreateJoinDate(): string {
  const existing = getSetting('join_date');
  if (existing) return existing;
  const now = new Date().toISOString().split('T')[0];
  setSetting('join_date', now);
  return now;
}

export function getJoinDate(): string {
  return getSetting('join_date') ?? '2026-01-01';
}

// ─── Streak ───────────────────────────────────────────────────

export function recordActivity(): { current: number; longest: number } {
  const db = getUserDb();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let current = parseInt(getSetting('streak_current') ?? '0', 10);
  let longest = parseInt(getSetting('streak_longest') ?? '0', 10);
  const lastActive = getSetting('streak_last_date') ?? '';

  if (lastActive === today) {
    return { current, longest };
  }

  if (lastActive === yesterday) {
    current += 1;
  } else if (lastActive !== today) {
    current = 1;
  }

  if (current > longest) longest = current;

  setSetting('streak_current', String(current));
  setSetting('streak_longest', String(longest));
  setSetting('streak_last_date', today);

  return { current, longest };
}

export function getStreak(): { current: number; longest: number } {
  const current = parseInt(getSetting('streak_current') ?? '0', 10);
  const longest = parseInt(getSetting('streak_longest') ?? '0', 10);
  return { current, longest };
}

// ─── Reading Time ─────────────────────────────────────────────

export function startSession(contentType: string, reference: string): number {
  const db = getUserDb();
  const now = Date.now();
  db.runSync(
    'INSERT INTO reading_sessions (start_time, content_type, reference) VALUES (?, ?, ?)',
    [now, contentType, reference]
  );
  return (db.getFirstSync('SELECT last_insert_rowid() as id') as any).id;
}

export function endSession(sessionId: number): number {
  const db = getUserDb();
  const now = Date.now();
  const session: any = db.getFirstSync('SELECT start_time FROM reading_sessions WHERE id = ?', [sessionId]);
  if (!session) return 0;
  const duration = Math.round((now - session.start_time) / 1000);
  db.runSync('UPDATE reading_sessions SET end_time = ?, duration = ? WHERE id = ?', [now, duration, sessionId]);
  const total = parseInt(getSetting('total_reading_seconds') ?? '0', 10);
  const updated = total + duration;
  setSetting('total_reading_seconds', String(updated));
  return duration;
}

export function getReadingTime(): {
  totalSeconds: number;
  sessionsCount: number;
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
} {
  const db = getUserDb();
  const totalSeconds = parseInt(getSetting('total_reading_seconds') ?? '0', 10);
  const sessionsCount = (db.getFirstSync('SELECT COUNT(*) as c FROM reading_sessions') as any).c;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const todayRow: any = db.getFirstSync(
    'SELECT COALESCE(SUM(duration), 0) as s FROM reading_sessions WHERE start_time >= ? AND duration IS NOT NULL',
    [todayTs]
  );
  const weekRow: any = db.getFirstSync(
    'SELECT COALESCE(SUM(duration), 0) as s FROM reading_sessions WHERE start_time >= ? AND duration IS NOT NULL',
    [weekStart.getTime()]
  );
  const monthRow: any = db.getFirstSync(
    'SELECT COALESCE(SUM(duration), 0) as s FROM reading_sessions WHERE start_time >= ? AND duration IS NOT NULL',
    [monthStart.getTime()]
  );

  return {
    totalSeconds,
    sessionsCount,
    todaySeconds: todayRow.s,
    weekSeconds: weekRow.s,
    monthSeconds: monthRow.s,
  };
}

// ─── Bible Progress ───────────────────────────────────────────

export function getBibleProgress(): {
  booksCompleted: number;
  chaptersRead: number;
  totalChapters: number;
  percentage: number;
} {
  const db = getUserDb();
  const bibleDb = getBibleDb();

  const totalChapters: number = (bibleDb.getFirstSync(
    'SELECT COUNT(*) as c FROM (SELECT DISTINCT book, chapter FROM verses)'
  ) as any).c ?? 1189;

  const uniqueChapters: any[] = db.getAllSync(
    "SELECT DISTINCT bible_ref FROM history WHERE item_type = 'bible' AND bible_ref IS NOT NULL"
  );
  const chaptersSet = new Set<string>();
  for (const r of uniqueChapters) {
    const parts = (r.bible_ref as string).split(':');
    if (parts.length >= 2) chaptersSet.add(`${parts[0]}:${parts[1]}`);
  }
  const chaptersRead = chaptersSet.size;

  const booksAll: any[] = bibleDb.getAllSync('SELECT DISTINCT book FROM verses');
  const booksRead = new Set<string>();
  for (const ref of chaptersSet) {
    booksRead.add(ref.split(':')[0]);
  }

  return {
    booksCompleted: booksRead.size,
    chaptersRead,
    totalChapters,
    percentage: totalChapters > 0 ? Math.round((chaptersRead / totalChapters) * 100) : 0,
  };
}

// ─── Hymn Progress ────────────────────────────────────────────

export function getHymnStats(): {
  hymnsOpened: number;
  uniqueHymns: number;
  totalHymns: number;
} {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    "SELECT DISTINCT hymn_id FROM history WHERE item_type = 'hymn' AND hymn_id IS NOT NULL"
  );
  const hymnsOpened: number = (db.getFirstSync(
    "SELECT COUNT(*) as c FROM history WHERE item_type = 'hymn'"
  ) as any).c;
  const totalHymns: number = (getContentDb().getFirstSync('SELECT COUNT(*) as c FROM hymns') as any).c ?? 376;
  return { hymnsOpened, uniqueHymns: rows.length, totalHymns };
}

// ─── Aggregate Stats ──────────────────────────────────────────

export function getQuickStats(libraryStore: {
  bookmarks: any[];
  favorites: any[];
  notes: any[];
  history: any[];
}): {
  bookmarks: number;
  bibleBookmarks: number;
  hymnBookmarks: number;
  favorites: number;
  bibleFavorites: number;
  hymnFavorites: number;
  notes: number;
  history: number;
} {
  return {
    bookmarks: libraryStore.bookmarks.length,
    bibleBookmarks: libraryStore.bookmarks.filter((b: any) => b.itemType === 'bible').length,
    hymnBookmarks: libraryStore.bookmarks.filter((b: any) => b.itemType === 'hymn').length,
    favorites: libraryStore.favorites.length,
    bibleFavorites: libraryStore.favorites.filter((f: any) => f.itemType === 'bible').length,
    hymnFavorites: libraryStore.favorites.filter((f: any) => f.itemType === 'hymn').length,
    notes: libraryStore.notes.length,
    history: libraryStore.history.length,
  };
}

// ─── Notifications ────────────────────────────────────────────

export function getNotificationPrefs(): {
  enabled: boolean;
  dailyReminder: boolean;
  readingReminder: boolean;
  devotionalReminder: boolean;
  worshipReminder: boolean;
} {
  const g = (k: string, def: string) => getSetting(k) ?? def;
  return {
    enabled: g('notif_enabled', '1') === '1',
    dailyReminder: g('notif_daily', '1') === '1',
    readingReminder: g('notif_reading', '1') === '1',
    devotionalReminder: g('notif_devotional', '1') === '1',
    worshipReminder: g('notif_worship', '1') === '1',
  };
}

export function setNotificationPref(key: string, value: boolean): void {
  const k = `notif_${key.replace('notif_', '')}`;
  setSetting(k, value ? '1' : '0');
}

// ─── Downloads Stats ──────────────────────────────────────────

export function getDownloadStats(): { hymns: number; bible: number; storageUsed: number } {
  const hymns = parseInt(getSetting('dl_hymns') ?? '0', 10);
  const bible = parseInt(getSetting('dl_bible') ?? '0', 10);
  const storageUsed = parseInt(getSetting('dl_storage') ?? '0', 10);
  return { hymns, bible, storageUsed };
}

// ─── Search Analytics ─────────────────────────────────────────

export function recordSearch(query: string): void {
  const count = parseInt(getSetting('search_count') ?? '0', 10);
  setSetting('search_count', String(count + 1));
  const recent = getSetting('search_recent') ?? '';
  const entries = recent ? recent.split('|') : [];
  entries.unshift(query);
  if (entries.length > 20) entries.pop();
  setSetting('search_recent', entries.join('|'));
}

export function getSearchStats(): { total: number; recent: string[] } {
  const total = parseInt(getSetting('search_count') ?? '0', 10);
  const recent = getSetting('search_recent') ?? '';
  return { total, recent: recent ? recent.split('|') : [] };
}

// ─── App Version ──────────────────────────────────────────────

export function getAppVersion(): string {
  try {
    return require('../../app.json').expo?.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}
