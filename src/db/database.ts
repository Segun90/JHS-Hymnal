import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync, deleteAsync } from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

const contentAsset = require('../../assets/db/content.db');
const bibleAsset = require('../../assets/db/kjv.sqlite');
const devotionalsAsset = require('../../assets/db/devotionals.db');

const BUNDLED_DB_VERSION = 2;
const DB_VERSION_KEY = 'bundled_db_version';

let contentDb: SQLite.SQLiteDatabase | null = null;
let bibleDb: SQLite.SQLiteDatabase | null = null;
let devotionalsDb: SQLite.SQLiteDatabase | null = null;
let userDb: SQLite.SQLiteDatabase | null = null;

async function ensureContentDbCopied(): Promise<void> {
  const dir = `${documentDirectory}SQLite`;
  const path = `${dir}/content.db`;
  await makeDirectoryAsync(dir, { intermediates: true });
  const { exists } = await getInfoAsync(path);
  if (exists) return;
  const asset = Asset.fromModule(contentAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('content.db asset failed to download');
  await copyAsync({ from: asset.localUri, to: path });
}

async function ensureBibleDbCopied(): Promise<void> {
  const dir = `${documentDirectory}SQLite`;
  const path = `${dir}/kjv.sqlite`;
  await makeDirectoryAsync(dir, { intermediates: true });
  const { exists } = await getInfoAsync(path);
  if (exists) return;
  const asset = Asset.fromModule(bibleAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('kjv.sqlite asset failed to download');
  await copyAsync({ from: asset.localUri, to: path });
}

async function ensureDevotionalsDbCopied(): Promise<void> {
  const dir = `${documentDirectory}SQLite`;
  const path = `${dir}/devotionals.db`;
  await makeDirectoryAsync(dir, { intermediates: true });
  const { exists } = await getInfoAsync(path);
  if (exists) return;
  const asset = Asset.fromModule(devotionalsAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('devotionals.db asset failed to download');
  await copyAsync({ from: asset.localUri, to: path });
}

const USER_SCHEMA = `
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('bible','hymn')),
  bible_ref TEXT, hymn_id INTEGER, label TEXT, preview_text TEXT,
  reading_position INTEGER, created_at INTEGER NOT NULL, modified_at INTEGER
);
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('bible','hymn')),
  bible_ref TEXT, hymn_id INTEGER, label TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('bible','hymn')),
  bible_ref TEXT, hymn_id INTEGER, body TEXT NOT NULL,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY,
  item_type TEXT NOT NULL, bible_ref TEXT, hymn_id INTEGER, viewed_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reading_sessions (
  id INTEGER PRIMARY KEY,
  start_time INTEGER NOT NULL,
  end_time INTEGER, duration INTEGER,
  content_type TEXT, reference TEXT
);
CREATE TABLE IF NOT EXISTS devotion_notes (
  day INTEGER PRIMARY KEY,
  completed_at INTEGER,
  note TEXT DEFAULT '',
  prayer TEXT DEFAULT '',
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devotional_progress (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_day INTEGER,
  last_completed_day INTEGER,
  last_completed_date INTEGER,
  last_read_date INTEGER,
  install_date INTEGER NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  devotional_enabled INTEGER NOT NULL DEFAULT 0,
  devotional_time TEXT NOT NULL DEFAULT '07:00',
  bible_enabled INTEGER NOT NULL DEFAULT 0,
  bible_time TEXT NOT NULL DEFAULT '07:00',
  prayer_enabled INTEGER NOT NULL DEFAULT 0,
  prayer_time TEXT NOT NULL DEFAULT '07:00',
  sound INTEGER NOT NULL DEFAULT 1,
  vibration INTEGER NOT NULL DEFAULT 1,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT
);
`;

function migrateUserDb(db: SQLite.SQLiteDatabase): void {
  const cols: string[] = [];
  const rows: any[] = db.getAllSync("PRAGMA table_info('bookmarks')");
  for (const r of rows) cols.push(r.name);
  if (!cols.includes('preview_text')) {
    try { db.execSync("ALTER TABLE bookmarks ADD COLUMN preview_text TEXT"); } catch {}
  }
  if (!cols.includes('reading_position')) {
    try { db.execSync("ALTER TABLE bookmarks ADD COLUMN reading_position INTEGER"); } catch {}
  }
  if (!cols.includes('modified_at')) {
    try { db.execSync("ALTER TABLE bookmarks ADD COLUMN modified_at INTEGER"); } catch {}
  }
  const ncols: string[] = [];
  const nrows: any[] = db.getAllSync("PRAGMA table_info('notes')");
  for (const r of nrows) ncols.push(r.name);
  if (!ncols.includes('created_at')) {
    try { db.execSync("ALTER TABLE notes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0"); } catch {}
  }
  if (!ncols.includes('updated_at')) {
    try { db.execSync("ALTER TABLE notes ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0"); } catch {}
  }
  const dcols: string[] = [];
  const drows: any[] = db.getAllSync("PRAGMA table_info('devotion_notes')");
  for (const r of drows) dcols.push(r.name);
  if (!dcols.includes('completed_at')) {
    try { db.execSync("ALTER TABLE devotion_notes ADD COLUMN completed_at INTEGER"); } catch {}
  }
  migrateReminderSettings(db);
}

function migrateReminderSettings(db: SQLite.SQLiteDatabase): void {
  try {
    const existing: any = db.getFirstSync('SELECT COUNT(*) as c FROM notification_settings');
    if (existing && existing.c > 0) return;
    let enabled = 0;
    let time = '07:00';
    const legacy: any = db.getFirstSync("SELECT value FROM settings WHERE key = 'devotion_reminder'");
    if (legacy?.value) {
      try {
        const parsed = JSON.parse(legacy.value);
        if (parsed && parsed.enabled) {
          const h = typeof parsed.hour === 'number' ? parsed.hour : 7;
          const m = typeof parsed.minute === 'number' ? parsed.minute : 0;
          enabled = 1;
          time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      } catch {}
    }
    db.runSync(
      'INSERT INTO notification_settings (id, devotional_enabled, devotional_time) VALUES (1, ?, ?)',
      [enabled, time]
    );
  } catch {}
}

function ensureBibleFtsPopulated(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS bible_fts USING fts4(text)');
    const row: any = db.getFirstSync("SELECT count(*) as c FROM bible_fts");
    if (row.c > 0) return;
    const total: any = db.getFirstSync('SELECT count(*) as c FROM verses');
    const BATCH = 500;
    for (let offset = 0; offset < total.c; offset += BATCH) {
      db.runSync(
        'INSERT INTO bible_fts(docid, text) SELECT id, text FROM verses ORDER BY id LIMIT ? OFFSET ?',
        [BATCH, offset]
      );
    }
  } catch (e) {
    console.warn('bible_fts population failed, search will use LIKE:', e);
  }
}

function readBundledDbVersion(db: SQLite.SQLiteDatabase): number | null {
  try {
    const row: any = db.getFirstSync('SELECT value FROM settings WHERE key = ?', [DB_VERSION_KEY]);
    return row?.value ? parseInt(row.value, 10) : null;
  } catch {
    return null;
  }
}

function writeBundledDbVersion(db: SQLite.SQLiteDatabase): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    DB_VERSION_KEY,
    String(BUNDLED_DB_VERSION),
  ]);
}

async function removeBundledDbCopies(): Promise<void> {
  const dir = `${documentDirectory}SQLite`;
  for (const name of ['content.db', 'kjv.sqlite', 'devotionals.db']) {
    const path = `${dir}/${name}`;
    const { exists } = await getInfoAsync(path);
    if (exists) {
      await deleteAsync(path, { idempotent: true });
    }
  }
}

export async function initDatabases(): Promise<void> {
  if (contentDb && bibleDb && userDb && devotionalsDb) return;
  userDb = await SQLite.openDatabaseAsync('user.db');
  await userDb.execAsync(USER_SCHEMA);
  if (readBundledDbVersion(userDb) !== BUNDLED_DB_VERSION) {
    await removeBundledDbCopies();
  }
  await Promise.all([ensureContentDbCopied(), ensureBibleDbCopied(), ensureDevotionalsDbCopied()]);
  contentDb = await SQLite.openDatabaseAsync('content.db');
  bibleDb = await SQLite.openDatabaseAsync('kjv.sqlite');
  devotionalsDb = await SQLite.openDatabaseAsync('devotionals.db');
  writeBundledDbVersion(userDb);
  contentDb.execSync('DROP TABLE IF EXISTS bible_books');
  contentDb.execSync('DROP TABLE IF EXISTS bible_verses');
  bibleDb.execSync('CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book, chapter)');
  ensureBibleFtsPopulated(bibleDb);
  migrateUserDb(userDb);
}

export function getContentDb(): SQLite.SQLiteDatabase {
  if (!contentDb) throw new Error('Databases not initialised — call initDatabases() first');
  return contentDb;
}

export function getBibleDb(): SQLite.SQLiteDatabase {
  if (!bibleDb) throw new Error('Databases not initialised — call initDatabases() first');
  return bibleDb;
}

export function getDevotionalsDb(): SQLite.SQLiteDatabase {
  if (!devotionalsDb) throw new Error('Databases not initialised — call initDatabases() first');
  return devotionalsDb;
}

export function getUserDb(): SQLite.SQLiteDatabase {
  if (!userDb) throw new Error('Databases not initialised — call initDatabases() first');
  return userDb;
}
