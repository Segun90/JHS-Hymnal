import { getContentDb } from './database';
import type { HymnSection, Hymn, Stanza, IndexEntry } from '../types';

export interface HymnBounds {
  minNumber: number;
  maxNumber: number;
  totalCount: number;
}

let cachedBounds: HymnBounds | null = null;

export function clearHymnBoundsCache(): void {
  cachedBounds = null;
}

export function getHymnBounds(): HymnBounds {
  if (cachedBounds) return cachedBounds;
  const db = getContentDb();
  const row: any = db.getFirstSync(
    'SELECT COALESCE(MIN(number), 1) as min_num, COALESCE(MAX(number), 0) as max_num, COUNT(*) as total_count FROM hymns'
  );
  const bounds: HymnBounds = {
    minNumber: row?.min_num ?? 1,
    maxNumber: row?.max_num ?? 0,
    totalCount: row?.total_count ?? 0,
  };
  if (bounds.totalCount > 0) {
    cachedBounds = bounds;
  }
  return bounds;
}

export function getAdjacentHymnNumbers(number: number): { prev: number | null; next: number | null } {
  const db = getContentDb();
  const prevRow: any = db.getFirstSync(
    'SELECT MAX(number) as num FROM hymns WHERE number < ?',
    [number]
  );
  const nextRow: any = db.getFirstSync(
    'SELECT MIN(number) as num FROM hymns WHERE number > ?',
    [number]
  );
  return {
    prev: prevRow?.num ?? null,
    next: nextRow?.num ?? null,
  };
}

export function getSections(): HymnSection[] {
  const db = getContentDb();
  const rows: any[] = db.getAllSync(`
    SELECT hs.id, hs.name, hs.sort_order,
           COUNT(h.id) as hymn_count,
           MIN(h.number) as min_number,
           MAX(h.number) as max_number
    FROM hymn_sections hs
    LEFT JOIN hymns h ON h.section_id = hs.id
    GROUP BY hs.id, hs.name, hs.sort_order
    ORDER BY hs.sort_order
  `);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
    hymnCount: r.hymn_count,
    minNumber: r.min_number ?? undefined,
    maxNumber: r.max_number ?? undefined,
  }));
}

export function getHymnsBySection(sectionId: number): Hymn[] {
  const db = getContentDb();
  const rows: any[] = db.getAllSync(
    'SELECT id, number, title, first_line, section_id FROM hymns WHERE section_id = ? ORDER BY number',
    [sectionId]
  );
  return rows.map(mapHymn);
}

export function getHymn(number: number): Hymn | null {
  const db = getContentDb();
  const row: any = db.getFirstSync(
    'SELECT id, number, title, first_line, section_id FROM hymns WHERE number = ?',
    [number]
  );
  return row ? mapHymn(row) : null;
}

export function hymnNumberExists(number: number): boolean {
  const db = getContentDb();
  const row: any = db.getFirstSync('SELECT 1 FROM hymns WHERE number = ?', [number]);
  return !!row;
}

export function getHymnWithStanzas(number: number): { hymn: Hymn; stanzas: Stanza[] } | null {
  const db = getContentDb();
  const hymnRow: any = db.getFirstSync(
    'SELECT h.id, h.number, h.title, h.first_line, h.section_id, hs.name as section_name FROM hymns h JOIN hymn_sections hs ON h.section_id = hs.id WHERE h.number = ?',
    [number]
  );
  if (!hymnRow) return null;
  const hymn = { ...mapHymn(hymnRow), sectionName: hymnRow.section_name };
  const stanzaRows: any[] = db.getAllSync(
    'SELECT id, hymn_id, stanza_type, stanza_number, text FROM hymn_stanzas WHERE hymn_id = ? ORDER BY id',
    [hymn.id]
  );
  const stanzas: Stanza[] = stanzaRows.map((r: any) => ({
    id: r.id, hymnId: r.hymn_id, stanzaType: r.stanza_type, stanzaNumber: r.stanza_number, text: r.text,
  }));
  return { hymn, stanzas };
}

export function getIndexEntries(indexType: 'topical' | 'general' | 'first_lines'): IndexEntry[] {
  const db = getContentDb();
  const rows: any[] = db.getAllSync(
    `SELECT ie.id, ie.index_type, ie.entry_text, ie.hymn_id, h.number as hymn_number
     FROM hymn_index_entries ie
     LEFT JOIN hymns h ON ie.hymn_id = h.id
     WHERE ie.index_type = ?
     ORDER BY ie.id`,
    [indexType]
  );
  return rows.map((r: any) => ({
    id: r.id,
    indexType: r.index_type,
    entryText: r.entry_text,
    hymnId: r.hymn_id,
    hymnNumber: r.hymn_number ?? r.hymn_id,
  }));
}

export function searchHymns(query: string, limit = 50): any[] {
  const db = getContentDb();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: any[] = [];
  const seenNumbers = new Set<number>();

  // Direct hymn number lookup when query is numeric (e.g. "12" or "250")
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    const exactRow: any = db.getFirstSync(
      'SELECT number, title, first_line FROM hymns WHERE number = ?',
      [num]
    );
    if (exactRow) {
      seenNumbers.add(exactRow.number);
      results.push({
        source: 'hymn' as const,
        rank: -100,
        hymnNumber: exactRow.number,
        hymnTitle: exactRow.title,
        matchField: 'number',
        text: exactRow.first_line ?? exactRow.title,
      });
    }
    const prefixRows: any[] = db.getAllSync(
      'SELECT number, title, first_line FROM hymns WHERE CAST(number AS TEXT) LIKE ? AND number != ? ORDER BY number LIMIT ?',
      [`${trimmed}%`, num, limit]
    );
    for (const r of prefixRows) {
      if (results.length >= limit) break;
      if (!seenNumbers.has(r.number)) {
        seenNumbers.add(r.number);
        results.push({
          source: 'hymn' as const,
          rank: -50,
          hymnNumber: r.number,
          hymnTitle: r.title,
          matchField: 'number',
          text: r.first_line ?? r.title,
        });
      }
    }
  }

  const remaining = limit - results.length;
  if (remaining <= 0) return results;

  const safe = escapeFts(trimmed);
  const lower = trimmed.toLowerCase();
  if (safe && safe !== '""') {
    const sql = `
      SELECT hf.rowid, h.number, h.title, h.first_line
      FROM hymn_fts hf
      JOIN hymns h ON hf.rowid = h.id
      WHERE hymn_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;
    try {
      const rows: any[] = db.getAllSync(sql, [safe, remaining]);
      for (const r of rows) {
        if (seenNumbers.has(r.number)) continue;
        seenNumbers.add(r.number);
        const title = r.title ?? '';
        const firstLine = r.first_line ?? '';
        const inTitle = title.toLowerCase().includes(lower);
        const inFirstLine = !inTitle && firstLine.toLowerCase().includes(lower);
        results.push({
          source: 'hymn' as const,
          rank: r.rank ?? 0,
          hymnNumber: r.number,
          hymnTitle: title,
          matchField: inTitle ? 'title' : inFirstLine ? 'first_line' : 'text',
          text: firstLine || title,
        });
      }
      return results;
    } catch {
      // Fall through to LIKE fallback below
    }
  }

  const pattern = `%${trimmed.replace(/[%_]/g, '\\$&')}%`;
  const rows: any[] = db.getAllSync(
    "SELECT number, title, first_line FROM hymns WHERE title LIKE ? ESCAPE '\\' OR first_line LIKE ? ESCAPE '\\' ORDER BY number LIMIT ?",
    [pattern, pattern, remaining]
  );
  for (const r of rows) {
    if (seenNumbers.has(r.number)) continue;
    seenNumbers.add(r.number);
    const title = r.title ?? '';
    const firstLine = r.first_line ?? '';
    results.push({
      source: 'hymn' as const,
      rank: 0,
      hymnNumber: r.number,
      hymnTitle: title,
      matchField: title.toLowerCase().includes(lower) ? 'title' : 'first_line',
      text: firstLine || title,
    });
  }
  return results;
}

function mapHymn(row: any): Hymn {
  return { id: row.id, number: row.number, title: row.title, firstLine: row.first_line, sectionId: row.section_id };
}

function escapeFts(raw: string): string {
  const tokens = raw.trim().split(/\s+/).slice(0, 8);
  if (tokens.length === 0) return '""';
  return tokens.map((t) => {
    const cleaned = t.replace(/[^\w]/g, '');
    return cleaned ? `"${cleaned}"` : '';
  }).filter(Boolean).join(' ');
}
