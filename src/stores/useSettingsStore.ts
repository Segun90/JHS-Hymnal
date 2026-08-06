import { create } from 'zustand';
import { getSetting, setSetting } from '../db/library';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  hydrated: boolean;
  themeMode: ThemeMode;
  readerFontSize: number;
  readerLineHeight: number;
  readerLetterSpacing: number;
  readerFontFamily: string;
  hymnFontSize: number;
  keepAwake: boolean;
  hasSeenWelcome: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setReaderFontSize: (size: number) => void;
  setReaderLineHeight: (lh: number) => void;
  setReaderLetterSpacing: (ls: number) => void;
  setReaderFontFamily: (font: string) => void;
  setHymnFontSize: (size: number) => void;
  setKeepAwake: (on: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  themeMode: 'system',
  readerFontSize: 20,
  readerLineHeight: 1.9,
  readerLetterSpacing: 0.25,
  readerFontFamily: 'NotoSerif',
  hymnFontSize: 18,
  keepAwake: false,
  hasSeenWelcome: false,

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    setSetting('themeMode', mode);
  },

  setReaderFontSize: (size) => {
    const clamped = Math.min(28, Math.max(14, size));
    set({ readerFontSize: clamped });
    setSetting('readerFontSize', String(clamped));
  },

  setReaderLineHeight: (lh) => {
    const clamped = Math.min(2.2, Math.max(1.4, Math.round(lh * 10) / 10));
    set({ readerLineHeight: clamped });
    setSetting('readerLineHeight', String(clamped));
  },

  setReaderLetterSpacing: (ls) => {
    const clamped = Math.min(0.5, Math.max(0, Math.round(ls * 100) / 100));
    set({ readerLetterSpacing: clamped });
    setSetting('readerLetterSpacing', String(clamped));
  },

  setReaderFontFamily: (font) => {
    set({ readerFontFamily: font });
    setSetting('readerFontFamily', font);
  },

  setHymnFontSize: (size) => {
    const clamped = Math.min(28, Math.max(14, size));
    set({ hymnFontSize: clamped });
    setSetting('hymnFontSize', String(clamped));
  },

  setKeepAwake: (on) => {
    set({ keepAwake: on });
    setSetting('keepAwake', on ? '1' : '0');
  },

  setHasSeenWelcome: (seen) => {
    set({ hasSeenWelcome: seen });
    setSetting('hasSeenWelcome', seen ? '1' : '0');
  },

  hydrate: async () => {
    try {
      const tm = await getSetting('themeMode');
      const rfs = await getSetting('readerFontSize');
      const rlh = await getSetting('readerLineHeight');
      const rls = await getSetting('readerLetterSpacing');
      const rff = await getSetting('readerFontFamily');
      const hfs = await getSetting('hymnFontSize');
      const ka = await getSetting('keepAwake');
      const hsw = await getSetting('hasSeenWelcome');
      set({
        themeMode: (tm as ThemeMode) || 'system',
        readerFontSize: rfs ? parseInt(rfs, 10) : 20,
        readerLineHeight: rlh ? parseFloat(rlh) : 1.9,
        readerLetterSpacing: rls ? parseFloat(rls) : 0.25,
        readerFontFamily: rff || 'NotoSerif',
        hymnFontSize: hfs ? parseInt(hfs, 10) : 18,
        keepAwake: ka === '1',
        hasSeenWelcome: hsw === '1',
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
}));
