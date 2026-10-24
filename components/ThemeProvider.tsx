'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  THEME_STORAGE_KEY,
  ThemeMode,
  ThemeTokens,
  getNextTheme,
  getThemeTokens,
  resolveInitialTheme,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  tokens: getThemeTokens('light'),
});

function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  const win = window as unknown as { __uceedPrepaintSheet?: CSSStyleSheet };
  if (win.__uceedPrepaintSheet && document.adoptedStyleSheets) {
    document.adoptedStyleSheets = Array.from(
      document.adoptedStyleSheets
    ).filter((s) => s !== win.__uceedPrepaintSheet);
    delete win.__uceedPrepaintSheet;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Deterministic initial state ('light') so SSR and initial client hydration match 100%.
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved = resolveInitialTheme(stored, prefersDark);
        setThemeState(resolved);
        applyThemeToDocument(resolved);
      } catch {
        // Ignore storage errors
      }
    }, 0);

    // Also listen for system color-scheme changes if user has not set a manual override
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== 'light' && stored !== 'dark') {
          const next = e.matches ? 'dark' : 'light';
          setThemeState(next);
          applyThemeToDocument(next);
        }
      } catch {
        // Ignore
      }
    };
    mql.addEventListener('change', handleMediaChange);

    return () => {
      clearTimeout(timer);
      mql.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    applyThemeToDocument(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    setTheme(getNextTheme(theme));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        tokens: getThemeTokens(theme),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeToggleButtonProps {
  showLabel?: boolean;
  className?: string;
  testId?: string;
}

export function ThemeToggleButton({
  showLabel = false,
  className = '',
  testId = 'theme-toggle-button',
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-testid={testId}
      aria-label={
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      }
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172033] px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors shrink-0 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 shrink-0" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="whitespace-nowrap">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
