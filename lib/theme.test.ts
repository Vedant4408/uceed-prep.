import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DARK_THEME_TOKENS,
  LIGHT_THEME_TOKENS,
  getChartThemeConfig,
  getNextTheme,
  getThemeTokens,
  resolveInitialTheme,
} from './theme';

test('resolveInitialTheme respects saved localStorage preference over device preference', () => {
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme('light', true), 'light');
});

test('resolveInitialTheme falls back to device prefers-color-scheme when no preference is stored', () => {
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(null, false), 'light');
  assert.equal(resolveInitialTheme('invalid', true), 'dark');
});

test('getNextTheme toggles deterministically between light and dark', () => {
  assert.equal(getNextTheme('light'), 'dark');
  assert.equal(getNextTheme('dark'), 'light');
});

test('getThemeTokens returns exact required Light Mode and Dark Mode hex tokens', () => {
  const light = getThemeTokens('light');
  assert.deepEqual(light, LIGHT_THEME_TOKENS);
  assert.equal(light.bgMain, '#FFFFFF');
  assert.equal(light.bgSecondary, '#F8FAFC');
  assert.equal(light.bgCard, '#FFFFFF');
  assert.equal(light.textPrimary, '#0F172A');
  assert.equal(light.textSecondary, '#475569');
  assert.equal(light.border, '#E2E8F0');
  assert.equal(light.accentPrimary, '#2563EB');
  assert.equal(light.success, '#15803D');
  assert.equal(light.error, '#DC2626');

  const dark = getThemeTokens('dark');
  assert.deepEqual(dark, DARK_THEME_TOKENS);
  assert.equal(dark.bgMain, '#0B1120');
  assert.equal(dark.bgSecondary, '#111827');
  assert.equal(dark.bgCard, '#172033');
  assert.equal(dark.bgElevated, '#1E293B');
  assert.equal(dark.textPrimary, '#F1F5F9');
  assert.equal(dark.textSecondary, '#CBD5E1');
  assert.equal(dark.border, '#334155');
  assert.equal(dark.accentPrimary, '#60A5FA');
  assert.equal(dark.success, '#4ADE80');
  assert.equal(dark.error, '#F87171');
});

test('getChartThemeConfig maps Recharts grid, axes, and tooltips to active theme tokens', () => {
  const lightChart = getChartThemeConfig('light');
  assert.equal(lightChart.gridStroke, '#E2E8F0');
  assert.equal(lightChart.axisTickColor, '#475569');
  assert.equal(lightChart.tooltipBg, '#FFFFFF');
  assert.equal(lightChart.primarySeries, '#2563EB');

  const darkChart = getChartThemeConfig('dark');
  assert.equal(darkChart.gridStroke, '#334155');
  assert.equal(darkChart.axisTickColor, '#CBD5E1');
  assert.equal(darkChart.tooltipBg, '#172033');
  assert.equal(darkChart.primarySeries, '#60A5FA');
});
