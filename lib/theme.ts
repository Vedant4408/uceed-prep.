export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'uceed_theme_v1';

export interface ThemeTokens {
  bgMain: string;
  bgSecondary: string;
  bgCard: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentPrimary: string;
  success: string;
  error: string;
}

export const LIGHT_THEME_TOKENS: ThemeTokens = {
  bgMain: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgElevated: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  accentPrimary: '#2563EB',
  success: '#15803D',
  error: '#DC2626',
};

export const DARK_THEME_TOKENS: ThemeTokens = {
  bgMain: '#0B1120',
  bgSecondary: '#111827',
  bgCard: '#172033',
  bgElevated: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  border: '#334155',
  accentPrimary: '#60A5FA',
  success: '#4ADE80',
  error: '#F87171',
};

/**
 * Pure helper to resolve the active theme from stored preference and device media query.
 */
export function resolveInitialTheme(
  storedValue: string | null | undefined,
  prefersDarkDevice: boolean
): ThemeMode {
  if (storedValue === 'dark' || storedValue === 'light') {
    return storedValue;
  }
  return prefersDarkDevice ? 'dark' : 'light';
}

/**
 * Pure helper to return the next theme when toggled.
 */
export function getNextTheme(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * Returns the exact design token palette for the active theme.
 */
export function getThemeTokens(theme: ThemeMode): ThemeTokens {
  return theme === 'dark' ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;
}

/**
 * Returns Recharts-compatible styling tokens for grid lines, axes, tooltips, and series colors.
 */
export function getChartThemeConfig(theme: ThemeMode) {
  const tokens = getThemeTokens(theme);
  return {
    gridStroke: tokens.border,
    axisTickColor: tokens.textSecondary,
    axisLineColor: tokens.border,
    tooltipBg: tokens.bgCard,
    tooltipBorder: tokens.border,
    tooltipText: tokens.textPrimary,
    tooltipLabel: tokens.textSecondary,
    primarySeries: tokens.accentPrimary,
    successSeries: tokens.success,
    errorSeries: tokens.error,
    secondarySeries: theme === 'dark' ? '#38BDF8' : '#0284C7',
    warningSeries: theme === 'dark' ? '#FBBF24' : '#D97706',
  };
}
