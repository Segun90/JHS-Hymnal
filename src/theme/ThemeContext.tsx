import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, type Palette } from './tokens';
import { useSettingsStore } from '../stores/useSettingsStore';

interface ThemeValue {
  palette: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue>({ palette: light, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const value = useMemo<ThemeValue>(() => {
    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
    return { palette: isDark ? dark : light, isDark };
  }, [themeMode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
