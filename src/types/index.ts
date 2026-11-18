export interface BibleBook {
  id: number;
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  bookOrder: number;
  chapterCount: number;
}

export interface Verse {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface HymnSection {
  id: number;
  name: string;
  sortOrder: number;
  hymnCount: number;
  minNumber?: number;
  maxNumber?: number;
}

export interface Hymn {
  id: number;
  number: number;
  title: string;
  firstLine: string | null;
  sectionId: number;
  sectionName?: string;
}

export interface Stanza {
  id: number;
  hymnId: number;
  stanzaType: 'verse' | 'chorus';
  stanzaNumber: number;
  text: string;
}

export interface IndexEntry {
  id: number;
  indexType: 'topical' | 'general' | 'first_lines';
  entryText: string;
  hymnId: number;
  hymnNumber?: number;
}

export interface LibraryItem {
  id: number;
  itemType: 'bible' | 'hymn';
  bibleRef: string | null;
  hymnId: number | null;
  label: string | null;
  createdAt: number;
  previewText: string | null;
  readingPosition: number | null;
}

export interface Note {
  id: number;
  itemType: 'bible' | 'hymn';
  bibleRef: string | null;
  hymnId: number | null;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryItem {
  id: number;
  itemType: 'bible' | 'hymn';
  bibleRef: string | null;
  hymnId: number | null;
  viewedAt: number;
}

export interface SearchResult {
  source: 'bible' | 'hymn';
  rank: number;
  bibleRef?: string;
  bookName?: string;
  chapter?: number;
  verse?: number;
  text: string;
  hymnNumber?: number;
  hymnTitle?: string;
  matchField?: string;
}

export type TargetRef = {
  itemType: 'bible' | 'hymn';
  bibleRef?: string | null;
  hymnId?: number | null;
  label?: string | null;
};

export interface Devotional {
  day: number;
  title: string;
  scripture: string;
  memoryVerse: string;
  devotional: string;
  prayer: string;
  reflection: string;
  actionPoint: string;
  tags: string;
  metadata: string | null;
}

export interface DevotionProgress {
  day: number;
  completedAt: number | null;
  notes: string | null;
  prayerJournal: string | null;
}

export interface DevotionalProgress {
  currentDay: number | null;
  lastCompletedDay: number | null;
  lastCompletedDate: number | null;
  lastReadDate: number | null;
  installDate: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  hasCurrent: boolean;
}
