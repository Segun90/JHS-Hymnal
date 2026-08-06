import { getContentDb } from './database';
import type { HymnSection, Hymn, Stanza, IndexEntry } from '../types';

export function getSections(): HymnSection[] {
  const db = getContentDb();
  const rows: any[] = db.getAllSync(`
    SELECT hs.id, hs.name, hs.sort_order,
           (SELECT COUNT(*) FROM hymns h WHERE h.section_id = hs.id) as hymn_count
    FROM hymn_sections hs
    ORDER BY hs.sort_order
  `);
  return rows.map((r: any) => ({
    id: r.id, name: r.name, sortOrder: r.sort_order, hymnCount: r.hymn_count,
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
    'SELECT id, index_type, entry_text, hymn_id FROM hymn_index_entries WHERE index_type = ? ORDER BY id',
    [indexType]
  );
  return rows.map((r: any) => ({
    id: r.id, indexType: r.index_type, entryText: r.entry_text, hymnId: r.hymn_id,
  }));
}

export function searchHymns(query: string, limit = 50): any[] {
  const db = getContentDb();
  const safe = escapeFts(query);
  const lower = query.trim().toLowerCase();
  const sql = `
    SELECT hf.rowid, h.number, h.title, h.first_line
    FROM hymn_fts hf
    JOIN hymns h ON hf.rowid = h.id
    WHERE hymn_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `;
  try {
    const rows: any[] = db.getAllSync(sql, [safe, limit]);
    return rows.map((r: any) => {
      const inTitle = r.title.toLowerCase().includes(lower);
      const inFirstLine = !inTitle && r.first_line.toLowerCase().includes(lower);
      return {
        source: 'hymn' as const,
        rank: r.rank ?? 0,
        hymnNumber: r.number,
        hymnTitle: r.title,
        matchField: inTitle ? 'title' : inFirstLine ? 'first_line' : 'text',
        text: r.first_line ?? r.title,
      };
    });
  } catch {
    const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;
    const rows: any[] = db.getAllSync(
      'SELECT number, title, first_line FROM hymns WHERE title LIKE ? OR first_line LIKE ? ORDER BY number LIMIT ?',
      [pattern, pattern, limit]
    );
    return rows.map((r: any) => ({
      source: 'hymn' as const,
      rank: 0,
      hymnNumber: r.number,
      hymnTitle: r.title,
      matchField: r.title.toLowerCase().includes(lower) ? 'title' : 'first_line',
      text: r.first_line ?? r.title,
    }));
  }
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
