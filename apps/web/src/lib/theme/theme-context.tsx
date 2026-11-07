'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  resolvedTheme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to document element
  const applyTheme = useCallback((targetTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    setResolvedTheme(targetTheme);
  }, []);

  // Update theme & persist to localStorage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('evolyn_theme', newTheme);
      } catch {
        // Ignore storage errors in restricted contexts
      }

      if (newTheme === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(isSystemDark ? 'dark' : 'light');
      } else {
        applyTheme(newTheme);
      }
    },
    [applyTheme]
  );

  // 1-click toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Initial client-side setup
  useEffect(() => {
    let saved: Theme = 'light';
    try {
      const stored = localStorage.getItem('evolyn_theme') as Theme | null;
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        saved = stored;
      }
    } catch {
      saved = 'light';
    }

    setThemeState(saved);

    if (saved === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(isSystemDark ? 'dark' : 'light');
    } else {
      applyTheme(saved);
    }

    setMounted(true);

    // Listen to system preference changes if 'system' is active
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem('evolyn_theme') === 'system') {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch {
        // ignore
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [applyTheme]);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

