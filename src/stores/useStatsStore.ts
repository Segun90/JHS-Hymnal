import { create } from 'zustand';
import * as stats from '../db/stats';
import { useLibraryStore } from './useLibraryStore';

const _unsub = useLibraryStore.subscribe(() => {
  const s = useStatsStore.getState();
  s.refresh();
});

interface StatsState {
  joinDate: string;
  streakCurrent: number;
  streakLongest: number;
  totalSeconds: number;
  sessionsCount: number;
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  booksCompleted: number;
  chaptersRead: number;
  totalChapters: number;
  biblePercentage: number;
  hymnsOpened: number;
  uniqueHymns: number;
  totalHymns: number;
  bookmarks: number;
  bibleBookmarks: number;
  hymnBookmarks: number;
  favorites: number;
  bibleFavorites: number;
  hymnFavorites: number;
  notesCount: number;
  historyCount: number;
  searchTotal: number;
  searchRecent: string[];
  appVersion: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => void;
  recordActivity: () => { current: number; longest: number };
  startSession: (type: string, ref: string) => number;
  endSession: (id: number) => number;
  recordSearch: (query: string) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  joinDate: '2026-01-01',
  streakCurrent: 0,
  streakLongest: 0,
  totalSeconds: 0,
  sessionsCount: 0,
  todaySeconds: 0,
  weekSeconds: 0,
  monthSeconds: 0,
  booksCompleted: 0,
  chaptersRead: 0,
  totalChapters: 1189,
  biblePercentage: 0,
  hymnsOpened: 0,
  uniqueHymns: 0,
  totalHymns: 0,
  bookmarks: 0,
  bibleBookmarks: 0,
  hymnBookmarks: 0,
  favorites: 0,
  bibleFavorites: 0,
  hymnFavorites: 0,
  notesCount: 0,
  historyCount: 0,
  searchTotal: 0,
  searchRecent: [],
  appVersion: '1.0.0',
  hydrated: false,

  hydrate: async () => {
    try {
      const joinDate = stats.getOrCreateJoinDate();
      const streak = stats.getStreak();
      const reading = stats.getReadingTime();
      const bible = stats.getBibleProgress();
      const hymn = stats.getHymnStats();
      const lib = useLibraryStore.getState();
      const quick = stats.getQuickStats(lib);
      const search = stats.getSearchStats();
      const version = stats.getAppVersion();
      set({
        joinDate, appVersion: version,
        streakCurrent: streak.current, streakLongest: streak.longest,
        totalSeconds: reading.totalSeconds, sessionsCount: reading.sessionsCount,
        todaySeconds: reading.todaySeconds, weekSeconds: reading.weekSeconds,
        monthSeconds: reading.monthSeconds,
        booksCompleted: bible.booksCompleted, chaptersRead: bible.chaptersRead,
        totalChapters: bible.totalChapters, biblePercentage: bible.percentage,
        hymnsOpened: hymn.hymnsOpened, uniqueHymns: hymn.uniqueHymns, totalHymns: hymn.totalHymns,
        bookmarks: quick.bookmarks, bibleBookmarks: quick.bibleBookmarks,
        hymnBookmarks: quick.hymnBookmarks,
        favorites: quick.favorites, bibleFavorites: quick.bibleFavorites,
        hymnFavorites: quick.hymnFavorites,
        notesCount: quick.notes, historyCount: quick.history,
        searchTotal: search.total, searchRecent: search.recent,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  refresh: () => {
    const streak = stats.getStreak();
    const reading = stats.getReadingTime();
    const bible = stats.getBibleProgress();
    const hymn = stats.getHymnStats();
    const lib = useLibraryStore.getState();
    const quick = stats.getQuickStats(lib);
    const search = stats.getSearchStats();
    set({
      streakCurrent: streak.current, streakLongest: streak.longest,
      totalSeconds: reading.totalSeconds, sessionsCount: reading.sessionsCount,
      todaySeconds: reading.todaySeconds, weekSeconds: reading.weekSeconds,
      monthSeconds: reading.monthSeconds,
      booksCompleted: bible.booksCompleted, chaptersRead: bible.chaptersRead,
      totalChapters: bible.totalChapters, biblePercentage: bible.percentage,
      hymnsOpened: hymn.hymnsOpened, uniqueHymns: hymn.uniqueHymns, totalHymns: hymn.totalHymns,
      bookmarks: quick.bookmarks, bibleBookmarks: quick.bibleBookmarks,
      hymnBookmarks: quick.hymnBookmarks,
      favorites: quick.favorites, bibleFavorites: quick.bibleFavorites,
      hymnFavorites: quick.hymnFavorites,
      notesCount: quick.notes, historyCount: quick.history,
      searchTotal: search.total, searchRecent: search.recent,
    });
  },

  recordActivity: () => {
    const result = stats.recordActivity();
    set({ streakCurrent: result.current, streakLongest: result.longest });
    return result;
  },

  startSession: (type, ref) => {
    return stats.startSession(type, ref);
  },

  endSession: (id) => {
    const duration = stats.endSession(id);
    const reading = stats.getReadingTime();
    set({
      totalSeconds: reading.totalSeconds,
      sessionsCount: reading.sessionsCount,
      todaySeconds: reading.todaySeconds,
      weekSeconds: reading.weekSeconds,
      monthSeconds: reading.monthSeconds,
    });
    return duration;
  },

  recordSearch: (query) => {
    stats.recordSearch(query);
    const search = stats.getSearchStats();
    set({ searchTotal: search.total, searchRecent: search.recent });
  },
}));
