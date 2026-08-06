import { create } from 'zustand';
import * as lib from '../db/library';
import type { LibraryItem, Note, HistoryItem, TargetRef } from '../types';

interface LibraryState {
  bookmarks: LibraryItem[];
  favorites: LibraryItem[];
  notes: Note[];
  history: HistoryItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  // Bookmarks
  addBookmark: (target: TargetRef, previewText?: string) => Promise<void>;
  removeBookmark: (id: number) => Promise<void>;
  toggleBookmark: (target: TargetRef, previewText?: string) => Promise<void>;
  isBookmarked: (target: TargetRef) => boolean;
  // Favorites
  addFavorite: (target: TargetRef) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  removeFavoriteByTarget: (target: TargetRef) => Promise<void>;
  toggleFavorite: (target: TargetRef) => Promise<void>;
  isFavorite: (target: TargetRef) => boolean;
  // Notes
  saveNote: (target: TargetRef, body: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  getNote: (target: TargetRef) => Note | null;
  // History
  record: (target: TargetRef) => Promise<void>;
  deleteHistoryItem: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  bookmarks: [],
  favorites: [],
  notes: [],
  history: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const [bookmarks, favorites, notes, history] = await Promise.all([
        lib.listBookmarks(),
        lib.listFavorites(),
        lib.listNotes(),
        lib.listHistory(),
      ]);
      set({ bookmarks, favorites, notes, history, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  refresh: async () => {
    const [bookmarks, favorites, notes, history] = await Promise.all([
      lib.listBookmarks(),
      lib.listFavorites(),
      lib.listNotes(),
      lib.listHistory(),
    ]);
    set({ bookmarks, favorites, notes, history });
  },

  // ─── Bookmarks ─────────────────────────────────────────────

  addBookmark: async (target, previewText) => {
    lib.addBookmark(target, previewText);
    const b = lib.listBookmarks();
    set({ bookmarks: b });
  },

  removeBookmark: async (id) => {
    lib.removeBookmark(id);
    const b = lib.listBookmarks();
    set({ bookmarks: b });
  },

  toggleBookmark: async (target, previewText) => {
    const exists = lib.bookmarkExists(target);
    if (exists) {
      const item = lib.getBookmarkByTarget(target);
      if (item) {
        lib.removeBookmark(item.id);
        const b = lib.listBookmarks();
        set({ bookmarks: b });
      }
    } else {
      lib.addBookmark(target, previewText);
      const b = lib.listBookmarks();
      set({ bookmarks: b });
    }
  },

  isBookmarked: (target) => lib.bookmarkExists(target),

  // ─── Favorites ─────────────────────────────────────────────

  addFavorite: async (target) => {
    lib.addFavorite(target);
    const f = lib.listFavorites();
    set({ favorites: f });
  },

  removeFavorite: async (id) => {
    lib.removeFavorite(id);
    const f = lib.listFavorites();
    set({ favorites: f });
  },

  removeFavoriteByTarget: async (target) => {
    lib.removeFavoriteByTarget(target);
    const f = lib.listFavorites();
    set({ favorites: f });
  },

  toggleFavorite: async (target) => {
    const exists = lib.favoriteExists(target);
    if (exists) {
      lib.removeFavoriteByTarget(target);
    } else {
      lib.addFavorite(target);
    }
    const f = lib.listFavorites();
    set({ favorites: f });
  },

  isFavorite: (target) => lib.favoriteExists(target),

  // ─── Notes ─────────────────────────────────────────────────

  saveNote: async (target, body) => {
    lib.upsertNote(target, body);
    const n = lib.listNotes();
    set({ notes: n });
  },

  deleteNote: async (id) => {
    lib.deleteNote(id);
    const n = lib.listNotes();
    set({ notes: n });
  },

  getNote: (target) => lib.getNoteByTarget(target),

  // ─── History ───────────────────────────────────────────────

  record: async (target) => {
    lib.recordHistory(target);
    const h = lib.listHistory();
    set({ history: h });
  },

  deleteHistoryItem: async (id) => {
    lib.deleteHistoryItem(id);
    const h = lib.listHistory();
    set({ history: h });
  },

  clearHistory: async () => {
    lib.clearAllHistory();
    set({ history: [] });
  },
}));
