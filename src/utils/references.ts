export function makeBibleRef(bookId: number, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

export function parseBibleRef(ref: string): { bookId: number; chapter: number; verse: number } | null {
  const parts = ref.split(':');
  if (parts.length !== 3) return null;
  const bookId = parseInt(parts[0], 10);
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) return null;
  return { bookId, chapter, verse };
}

const BOOK_NAMES: Record<number, string> = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalm', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
  65: 'Jude', 66: 'Revelation',
};

export function formatBibleRef(ref: string): string {
  const parsed = parseBibleRef(ref);
  if (!parsed) return ref;
  const name = BOOK_NAMES[parsed.bookId] || `Book ${parsed.bookId}`;
  return `${name} ${parsed.chapter}:${parsed.verse}`;
}

export function formatBibleChapter(ref: string): string {
  const parsed = parseBibleRef(ref);
  if (!parsed) return ref;
  const name = BOOK_NAMES[parsed.bookId] || `Book ${parsed.bookId}`;
  return `${name} ${parsed.chapter}`;
}

const BOOK_NAME_IDS: [string, number][] = Object.entries(BOOK_NAMES)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([id, name]) => [name.toLowerCase(), Number(id)] as [string, number]);

export function parseScriptureRef(ref: string): { bookId: number; chapter: number; verseStart: number; verseEnd: number } | null {
  const cleaned = ref.trim().replace(/\.+$/, '');
  for (const [name, bookId] of BOOK_NAME_IDS) {
    if (cleaned.toLowerCase().startsWith(name)) {
      const rest = cleaned.slice(name.length).trim();
      const m = rest.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?/);
      if (!m) return null;
      const chapter = parseInt(m[1], 10);
      const verseStart = m[2] ? parseInt(m[2], 10) : 1;
      const verseEnd = m[3] ? parseInt(m[3], 10) : verseStart;
      return { bookId, chapter, verseStart, verseEnd };
    }
  }
  return null;
}
