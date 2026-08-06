import { getBibleDb } from './database';
import type { BibleBook, Verse } from '../types';

const BOOKS: Omit<BibleBook, 'chapterCount'>[] = [
  { id: 1, name: 'Genesis', abbreviation: 'Gen', testament: 'OT', bookOrder: 1 },
  { id: 2, name: 'Exodus', abbreviation: 'Exo', testament: 'OT', bookOrder: 2 },
  { id: 3, name: 'Leviticus', abbreviation: 'Lev', testament: 'OT', bookOrder: 3 },
  { id: 4, name: 'Numbers', abbreviation: 'Num', testament: 'OT', bookOrder: 4 },
  { id: 5, name: 'Deuteronomy', abbreviation: 'Deu', testament: 'OT', bookOrder: 5 },
  { id: 6, name: 'Joshua', abbreviation: 'Jos', testament: 'OT', bookOrder: 6 },
  { id: 7, name: 'Judges', abbreviation: 'Jdg', testament: 'OT', bookOrder: 7 },
  { id: 8, name: 'Ruth', abbreviation: 'Rut', testament: 'OT', bookOrder: 8 },
  { id: 9, name: '1 Samuel', abbreviation: '1Sa', testament: 'OT', bookOrder: 9 },
  { id: 10, name: '2 Samuel', abbreviation: '2Sa', testament: 'OT', bookOrder: 10 },
  { id: 11, name: '1 Kings', abbreviation: '1Ki', testament: 'OT', bookOrder: 11 },
  { id: 12, name: '2 Kings', abbreviation: '2Ki', testament: 'OT', bookOrder: 12 },
  { id: 13, name: '1 Chronicles', abbreviation: '1Ch', testament: 'OT', bookOrder: 13 },
  { id: 14, name: '2 Chronicles', abbreviation: '2Ch', testament: 'OT', bookOrder: 14 },
  { id: 15, name: 'Ezra', abbreviation: 'Ezr', testament: 'OT', bookOrder: 15 },
  { id: 16, name: 'Nehemiah', abbreviation: 'Neh', testament: 'OT', bookOrder: 16 },
  { id: 17, name: 'Esther', abbreviation: 'Est', testament: 'OT', bookOrder: 17 },
  { id: 18, name: 'Job', abbreviation: 'Job', testament: 'OT', bookOrder: 18 },
  { id: 19, name: 'Psalms', abbreviation: 'Psa', testament: 'OT', bookOrder: 19 },
  { id: 20, name: 'Proverbs', abbreviation: 'Pro', testament: 'OT', bookOrder: 20 },
  { id: 21, name: 'Ecclesiastes', abbreviation: 'Ecc', testament: 'OT', bookOrder: 21 },
  { id: 22, name: 'Song of Solomon', abbreviation: 'Son', testament: 'OT', bookOrder: 22 },
  { id: 23, name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', bookOrder: 23 },
  { id: 24, name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', bookOrder: 24 },
  { id: 25, name: 'Lamentations', abbreviation: 'Lam', testament: 'OT', bookOrder: 25 },
  { id: 26, name: 'Ezekiel', abbreviation: 'Eze', testament: 'OT', bookOrder: 26 },
  { id: 27, name: 'Daniel', abbreviation: 'Dan', testament: 'OT', bookOrder: 27 },
  { id: 28, name: 'Hosea', abbreviation: 'Hos', testament: 'OT', bookOrder: 28 },
  { id: 29, name: 'Joel', abbreviation: 'Joe', testament: 'OT', bookOrder: 29 },
  { id: 30, name: 'Amos', abbreviation: 'Amo', testament: 'OT', bookOrder: 30 },
  { id: 31, name: 'Obadiah', abbreviation: 'Oba', testament: 'OT', bookOrder: 31 },
  { id: 32, name: 'Jonah', abbreviation: 'Jon', testament: 'OT', bookOrder: 32 },
  { id: 33, name: 'Micah', abbreviation: 'Mic', testament: 'OT', bookOrder: 33 },
  { id: 34, name: 'Nahum', abbreviation: 'Nah', testament: 'OT', bookOrder: 34 },
  { id: 35, name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', bookOrder: 35 },
  { id: 36, name: 'Zephaniah', abbreviation: 'Zep', testament: 'OT', bookOrder: 36 },
  { id: 37, name: 'Haggai', abbreviation: 'Hag', testament: 'OT', bookOrder: 37 },
  { id: 38, name: 'Zechariah', abbreviation: 'Zec', testament: 'OT', bookOrder: 38 },
  { id: 39, name: 'Malachi', abbreviation: 'Mal', testament: 'OT', bookOrder: 39 },
  { id: 40, name: 'Matthew', abbreviation: 'Mat', testament: 'NT', bookOrder: 40 },
  { id: 41, name: 'Mark', abbreviation: 'Mar', testament: 'NT', bookOrder: 41 },
  { id: 42, name: 'Luke', abbreviation: 'Luk', testament: 'NT', bookOrder: 42 },
  { id: 43, name: 'John', abbreviation: 'Joh', testament: 'NT', bookOrder: 43 },
  { id: 44, name: 'Acts', abbreviation: 'Act', testament: 'NT', bookOrder: 44 },
  { id: 45, name: 'Romans', abbreviation: 'Rom', testament: 'NT', bookOrder: 45 },
  { id: 46, name: '1 Corinthians', abbreviation: '1Co', testament: 'NT', bookOrder: 46 },
  { id: 47, name: '2 Corinthians', abbreviation: '2Co', testament: 'NT', bookOrder: 47 },
  { id: 48, name: 'Galatians', abbreviation: 'Gal', testament: 'NT', bookOrder: 48 },
  { id: 49, name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', bookOrder: 49 },
  { id: 50, name: 'Philippians', abbreviation: 'Phi', testament: 'NT', bookOrder: 50 },
  { id: 51, name: 'Colossians', abbreviation: 'Col', testament: 'NT', bookOrder: 51 },
  { id: 52, name: '1 Thessalonians', abbreviation: '1Th', testament: 'NT', bookOrder: 52 },
  { id: 53, name: '2 Thessalonians', abbreviation: '2Th', testament: 'NT', bookOrder: 53 },
  { id: 54, name: '1 Timothy', abbreviation: '1Ti', testament: 'NT', bookOrder: 54 },
  { id: 55, name: '2 Timothy', abbreviation: '2Ti', testament: 'NT', bookOrder: 55 },
  { id: 56, name: 'Titus', abbreviation: 'Tit', testament: 'NT', bookOrder: 56 },
  { id: 57, name: 'Philemon', abbreviation: 'Phe', testament: 'NT', bookOrder: 57 },
  { id: 58, name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', bookOrder: 58 },
  { id: 59, name: 'James', abbreviation: 'Jas', testament: 'NT', bookOrder: 59 },
  { id: 60, name: '1 Peter', abbreviation: '1Pe', testament: 'NT', bookOrder: 60 },
  { id: 61, name: '2 Peter', abbreviation: '2Pe', testament: 'NT', bookOrder: 61 },
  { id: 62, name: '1 John', abbreviation: '1Jn', testament: 'NT', bookOrder: 62 },
  { id: 63, name: '2 John', abbreviation: '2Jn', testament: 'NT', bookOrder: 63 },
  { id: 64, name: '3 John', abbreviation: '3Jn', testament: 'NT', bookOrder: 64 },
  { id: 65, name: 'Jude', abbreviation: 'Jude', testament: 'NT', bookOrder: 65 },
  { id: 66, name: 'Revelation', abbreviation: 'Rev', testament: 'NT', bookOrder: 66 },
];

function chapterCounts(): Record<number, number> {
  const db = getBibleDb();
  const rows: any[] = db.getAllSync('SELECT book, COUNT(DISTINCT chapter) as cnt FROM verses GROUP BY book');
  const map: Record<number, number> = {};
  for (const r of rows) map[r.book] = r.cnt;
  return map;
}

let cachedCounts: Record<number, number> | null = null;

function getChapterCounts(): Record<number, number> {
  if (!cachedCounts) cachedCounts = chapterCounts();
  return cachedCounts;
}

export function getBooks(testament?: 'OT' | 'NT'): BibleBook[] {
  const counts = getChapterCounts();
  const filtered = testament ? BOOKS.filter((b) => b.testament === testament) : BOOKS;
  return filtered.map((b) => ({ ...b, chapterCount: counts[b.id] ?? 0 }));
}

export function getBook(bookId: number): BibleBook | null {
  const book = BOOKS.find((b) => b.id === bookId);
  if (!book) return null;
  const counts = getChapterCounts();
  return { ...book, chapterCount: counts[book.id] ?? 0 };
}

export function getChapterCount(bookId: number): number {
  const counts = getChapterCounts();
  return counts[bookId] ?? 0;
}

export function getVerse(bookId: number, chapter: number, verse: number): Verse | null {
  const db = getBibleDb();
  const r: any = db.getFirstSync(
    'SELECT id, book, chapter, verse, text FROM verses WHERE book = ? AND chapter = ? AND verse = ?',
    [bookId, chapter, verse]
  );
  if (!r) return null;
  return { id: r.id, bookId: r.book, chapter: r.chapter, verse: r.verse, text: r.text };
}

export function getChapter(bookId: number, chapter: number): Verse[] {
  const db = getBibleDb();
  const rows: any[] = db.getAllSync(
    'SELECT id, book, chapter, verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse',
    [bookId, chapter]
  );
  return rows.map((r: any) => ({
    id: r.id, bookId: r.book, chapter: r.chapter, verse: r.verse, text: r.text,
  }));
}

function ftsQuery(raw: string): string {
  const tokens = raw.trim().split(/\s+/).slice(0, 8);
  if (tokens.length === 0) return '';
  return tokens
    .map((t) => {
      const cleaned = t.replace(/[^\w'-]/g, '');
      return cleaned ? `"${cleaned}"` : '';
    })
    .filter(Boolean)
    .join(' ');
}

function hasFts(): boolean {
  try {
    const db = getBibleDb();
    db.getFirstSync('SELECT count(*) FROM bible_fts LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

export function searchBible(query: string, limit = 100): any[] {
  const db = getBibleDb();
  const booksMap: Record<number, (typeof BOOKS)[number]> = {};
  for (const b of BOOKS) booksMap[b.id] = b;
  const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;

  if (hasFts()) {
    const fts = ftsQuery(query);
    if (fts) {
      try {
        const rows: any[] = db.getAllSync(
          'SELECT v.book, v.chapter, v.verse, v.text FROM bible_fts bf JOIN verses v ON bf.docid = v.id WHERE bible_fts MATCH ? ORDER BY bf.docid LIMIT ?',
          [fts, limit]
        );
        return rows.map((r: any) => {
          const b = booksMap[r.book] ?? { name: `Book ${r.book}`, abbreviation: `B${r.book}` };
          return {
            source: 'bible' as const,
            rank: 0,
            bibleRef: `${r.book}:${r.chapter}:${r.verse}`,
            bookName: b.name,
            bookAbbrev: b.abbreviation,
            chapter: r.chapter,
            verse: r.verse,
            text: r.text,
          };
        });
      } catch {
        // fall through to LIKE
      }
    }
  }

  const rows: any[] = db.getAllSync(
    'SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? ORDER BY book, chapter, verse LIMIT ?',
    [pattern, limit]
  );
  return rows.map((r: any) => {
    const b = booksMap[r.book] ?? { name: `Book ${r.book}`, abbreviation: `B${r.book}` };
    return {
      source: 'bible' as const,
      rank: 0,
      bibleRef: `${r.book}:${r.chapter}:${r.verse}`,
      bookName: b.name,
      bookAbbrev: b.abbreviation,
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
    };
  });
}

export function searchBibleByBook(query: string, bookId: number, limit = 100): any[] {
  const db = getBibleDb();
  const b = BOOKS.find((x) => x.id === bookId) ?? { name: `Book ${bookId}`, abbreviation: `B${bookId}` };
  const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;

  if (hasFts()) {
    const fts = ftsQuery(query);
    if (fts) {
      try {
        const rows: any[] = db.getAllSync(
          'SELECT v.book, v.chapter, v.verse, v.text FROM bible_fts bf JOIN verses v ON bf.docid = v.id WHERE bible_fts MATCH ? AND v.book = ? ORDER BY bf.docid LIMIT ?',
          [fts, bookId, limit]
        );
        return rows.map((r: any) => ({
          source: 'bible' as const,
          rank: 0,
          bibleRef: `${r.book}:${r.chapter}:${r.verse}`,
          bookName: b.name,
          bookAbbrev: b.abbreviation,
          chapter: r.chapter,
          verse: r.verse,
          text: r.text,
        }));
      } catch {
        // fall through to LIKE
      }
    }
  }

  const rows: any[] = db.getAllSync(
    'SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? AND book = ? ORDER BY chapter, verse LIMIT ?',
    [pattern, bookId, limit]
  );
  return rows.map((r: any) => ({
    source: 'bible' as const,
    rank: 0,
    bibleRef: `${r.book}:${r.chapter}:${r.verse}`,
    bookName: b.name,
    bookAbbrev: b.abbreviation,
    chapter: r.chapter,
    verse: r.verse,
    text: r.text,
  }));
}
