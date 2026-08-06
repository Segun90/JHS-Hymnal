import { getUserDb } from './database';
import type { LibraryItem, Note, HistoryItem, TargetRef } from '../types';

// ─── Bookmarks ─────────────────────────────────────────────────

export function listBookmarks(): LibraryItem[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    `SELECT id, item_type, bible_ref, hymn_id, label, preview_text, reading_position, created_at, modified_at
     FROM bookmarks ORDER BY created_at DESC`
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    label: r.label, previewText: r.preview_text, readingPosition: r.reading_position,
    createdAt: r.created_at,
  }));
}

export function searchBookmarks(query: string): LibraryItem[] {
  const db = getUserDb();
  const q = `%${query}%`;
  const rows: any[] = db.getAllSync(
    `SELECT id, item_type, bible_ref, hymn_id, label, preview_text, reading_position, created_at, modified_at
     FROM bookmarks
     WHERE label LIKE ? OR bible_ref LIKE ? OR preview_text LIKE ?
     ORDER BY created_at DESC`,
    [q, q, q]
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    label: r.label, previewText: r.preview_text, readingPosition: r.reading_position,
    createdAt: r.created_at,
  }));
}

export function addBookmark(target: TargetRef, previewText?: string): void {
  const db = getUserDb();
  const now = Date.now();
  db.runSync(
    `INSERT INTO bookmarks (item_type, bible_ref, hymn_id, label, preview_text, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [target.itemType, target.bibleRef ?? null, target.hymnId ?? null,
     target.label ?? null, previewText ?? null, now, now]
  );
}

export function removeBookmark(id: number): void {
  const db = getUserDb();
  db.runSync('DELETE FROM bookmarks WHERE id = ?', [id]);
}

export function bookmarkExists(target: TargetRef): boolean {
  const db = getUserDb();
  if (target.itemType === 'bible' && target.bibleRef) {
    const row: any = db.getFirstSync(
      `SELECT 1 FROM bookmarks WHERE item_type = 'bible' AND bible_ref = ?`,
      [target.bibleRef]
    );
    return !!row;
  }
  if (target.itemType === 'hymn' && target.hymnId) {
    const row: any = db.getFirstSync(
      `SELECT 1 FROM bookmarks WHERE item_type = 'hymn' AND hymn_id = ?`,
      [target.hymnId]
    );
    return !!row;
  }
  return false;
}

export function getBookmarkByTarget(target: TargetRef): LibraryItem | null {
  const db = getUserDb();
  if (target.itemType === 'bible' && target.bibleRef) {
    const r: any = db.getFirstSync(
      `SELECT id, item_type, bible_ref, hymn_id, label, preview_text, reading_position, created_at, modified_at
       FROM bookmarks WHERE item_type = 'bible' AND bible_ref = ?`,
      [target.bibleRef]
    );
    return r ? mapItem(r) : null;
  }
  if (target.itemType === 'hymn' && target.hymnId) {
    const r: any = db.getFirstSync(
      `SELECT id, item_type, bible_ref, hymn_id, label, preview_text, reading_position, created_at, modified_at
       FROM bookmarks WHERE item_type = 'hymn' AND hymn_id = ?`,
      [target.hymnId]
    );
    return r ? mapItem(r) : null;
  }
  return null;
}

// ─── Favorites ─────────────────────────────────────────────────

export function listFavorites(): LibraryItem[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    `SELECT id, item_type, bible_ref, hymn_id, label, created_at FROM favorites ORDER BY created_at DESC`
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    label: r.label, previewText: null, readingPosition: null, createdAt: r.created_at,
  }));
}

export function searchFavorites(query: string): LibraryItem[] {
  const db = getUserDb();
  const q = `%${query}%`;
  const rows: any[] = db.getAllSync(
    `SELECT id, item_type, bible_ref, hymn_id, label, created_at FROM favorites
     WHERE label LIKE ? OR bible_ref LIKE ?
     ORDER BY created_at DESC`,
    [q, q]
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    label: r.label, previewText: null, readingPosition: null, createdAt: r.created_at,
  }));
}

export function addFavorite(target: TargetRef): void {
  const db = getUserDb();
  db.runSync(
    `INSERT OR IGNORE INTO favorites (item_type, bible_ref, hymn_id, label, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [target.itemType, target.bibleRef ?? null, target.hymnId ?? null,
     target.label ?? null, Date.now()]
  );
}

export function removeFavorite(id: number): void {
  const db = getUserDb();
  db.runSync('DELETE FROM favorites WHERE id = ?', [id]);
}

export function removeFavoriteByTarget(target: TargetRef): void {
  const db = getUserDb();
  if (target.itemType === 'bible' && target.bibleRef) {
    db.runSync("DELETE FROM favorites WHERE item_type = 'bible' AND bible_ref = ?", [target.bibleRef]);
  } else if (target.itemType === 'hymn' && target.hymnId) {
    db.runSync("DELETE FROM favorites WHERE item_type = 'hymn' AND hymn_id = ?", [target.hymnId]);
  }
}

export function favoriteExists(target: TargetRef): boolean {
  const db = getUserDb();
  if (target.itemType === 'bible' && target.bibleRef) {
    const row: any = db.getFirstSync(
      `SELECT 1 FROM favorites WHERE item_type = 'bible' AND bible_ref = ?`,
      [target.bibleRef]
    );
    return !!row;
  }
  if (target.itemType === 'hymn' && target.hymnId) {
    const row: any = db.getFirstSync(
      `SELECT 1 FROM favorites WHERE item_type = 'hymn' AND hymn_id = ?`,
      [target.hymnId]
    );
    return !!row;
  }
  return false;
}

// ─── Notes ─────────────────────────────────────────────────────

export function listNotes(): Note[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    'SELECT id, item_type, bible_ref, hymn_id, body, created_at, updated_at FROM notes ORDER BY updated_at DESC'
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    body: r.body, createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

export function searchNotes(query: string): Note[] {
  const db = getUserDb();
  const q = `%${query}%`;
  const rows: any[] = db.getAllSync(
    `SELECT id, item_type, bible_ref, hymn_id, body, created_at, updated_at FROM notes
     WHERE body LIKE ? OR bible_ref LIKE ?
     ORDER BY updated_at DESC`,
    [q, q]
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    body: r.body, createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

export function upsertNote(target: TargetRef, body: string): void {
  const db = getUserDb();
  const now = Date.now();
  const existing: any = target.bibleRef
    ? db.getFirstSync('SELECT id FROM notes WHERE item_type = ? AND bible_ref = ?', [target.itemType, target.bibleRef])
    : db.getFirstSync('SELECT id FROM notes WHERE item_type = ? AND hymn_id = ?', [target.itemType, target.hymnId ?? null]);
  if (existing) {
    db.runSync('UPDATE notes SET body = ?, updated_at = ? WHERE id = ?', [body, now, existing.id]);
  } else {
    db.runSync(
      'INSERT INTO notes (item_type, bible_ref, hymn_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [target.itemType, target.bibleRef ?? null, target.hymnId ?? null, body, now, now]
    );
  }
}

export function getNoteByTarget(target: TargetRef): Note | null {
  const db = getUserDb();
  const r: any = target.bibleRef
    ? db.getFirstSync('SELECT * FROM notes WHERE item_type = ? AND bible_ref = ?', [target.itemType, target.bibleRef])
    : db.getFirstSync('SELECT * FROM notes WHERE item_type = ? AND hymn_id = ?', [target.itemType, target.hymnId ?? null]);
  if (!r) return null;
  return { id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at };
}

export function deleteNote(id: number): void {
  const db = getUserDb();
  db.runSync('DELETE FROM notes WHERE id = ?', [id]);
}

export function deleteNoteByTarget(target: TargetRef): void {
  const db = getUserDb();
  if (target.bibleRef) {
    db.runSync('DELETE FROM notes WHERE item_type = ? AND bible_ref = ?', [target.itemType, target.bibleRef]);
  } else if (target.hymnId) {
    db.runSync('DELETE FROM notes WHERE item_type = ? AND hymn_id = ?', [target.itemType, target.hymnId]);
  }
}

// ─── History ───────────────────────────────────────────────────

export function recordHistory(target: TargetRef): void {
  const db = getUserDb();
  const now = Date.now();
  const sixtySecAgo = now - 60000;
  if (target.itemType === 'bible' && target.bibleRef) {
    const recent: any = db.getFirstSync(
      "SELECT id FROM history WHERE item_type = 'bible' AND bible_ref = ? AND viewed_at > ?",
      [target.bibleRef, sixtySecAgo]
    );
    if (recent) {
      db.runSync('UPDATE history SET viewed_at = ? WHERE id = ?', [now, recent.id]);
      return;
    }
    db.runSync("INSERT INTO history (item_type, bible_ref, hymn_id, viewed_at) VALUES ('bible', ?, NULL, ?)",
      [target.bibleRef, now]);
  } else if (target.itemType === 'hymn' && target.hymnId) {
    const recent: any = db.getFirstSync(
      "SELECT id FROM history WHERE item_type = 'hymn' AND hymn_id = ? AND viewed_at > ?",
      [target.hymnId, sixtySecAgo]
    );
    if (recent) {
      db.runSync('UPDATE history SET viewed_at = ? WHERE id = ?', [now, recent.id]);
      return;
    }
    db.runSync("INSERT INTO history (item_type, bible_ref, hymn_id, viewed_at) VALUES ('hymn', NULL, ?, ?)",
      [target.hymnId, now]);
  }
  const count: any = db.getFirstSync('SELECT COUNT(*) as c FROM history');
  if (count.c > 500) {
    db.runSync('DELETE FROM history WHERE id IN (SELECT id FROM history ORDER BY viewed_at ASC LIMIT ?)', [count.c - 500]);
  }
}

export function listHistory(limit = 200): HistoryItem[] {
  const db = getUserDb();
  const rows: any[] = db.getAllSync(
    'SELECT * FROM history ORDER BY viewed_at DESC LIMIT ?',
    [limit]
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id, viewedAt: r.viewed_at,
  }));
}

export function searchHistory(query: string): HistoryItem[] {
  const db = getUserDb();
  const q = `%${query}%`;
  const rows: any[] = db.getAllSync(
    `SELECT * FROM history WHERE bible_ref LIKE ? ORDER BY viewed_at DESC LIMIT 200`,
    [q]
  );
  return rows.map((r: any) => ({
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id, viewedAt: r.viewed_at,
  }));
}

export function deleteHistoryItem(id: number): void {
  const db = getUserDb();
  db.runSync('DELETE FROM history WHERE id = ?', [id]);
}

export function clearAllHistory(): void {
  const db = getUserDb();
  db.runSync('DELETE FROM history');
}

// ─── Settings ──────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const db = getUserDb();
  const row: any = db.getFirstSync('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getUserDb();
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

// ─── Helpers ───────────────────────────────────────────────────

function mapItem(r: any): LibraryItem {
  return {
    id: r.id, itemType: r.item_type, bibleRef: r.bible_ref, hymnId: r.hymn_id,
    label: r.label, previewText: r.preview_text, readingPosition: r.reading_position,
    createdAt: r.created_at,
  };
}
