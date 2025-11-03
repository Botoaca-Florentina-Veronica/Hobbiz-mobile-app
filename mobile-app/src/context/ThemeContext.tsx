import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import storage from '../services/storage';
import { lightTokens, darkTokens, Tokens } from '../theme/tokens';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  tokens: Tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'app-theme-preference';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getItemAsync(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setModeState(saved);
        }
      } catch (e) {
        // Fallback to auto if storage fails
      }
    })();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await storage.setItemAsync(THEME_KEY, newMode);
    } catch (e) {
      // Silently fail
    }
  };

  const isDark = mode === 'auto' ? systemScheme === 'dark' : mode === 'dark';
  const tokens = isDark ? darkTokens : lightTokens;

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
};
