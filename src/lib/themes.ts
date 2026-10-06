import type { Theme } from '../types';
export const THEMES: { id: Theme; label: string; mode: 'light' | 'dark'; swatch: string }[] = [
  { id: 'light', label: 'Porcelain', mode: 'light', swatch: '#e2e8f0' },
  { id: 'sand', label: 'Warm Sand', mode: 'light', swatch: '#d6bc92' },
  { id: 'mint', label: 'Fresh Mint', mode: 'light', swatch: '#6ba98c' },
  { id: 'lavender', label: 'Soft Lavender', mode: 'light', swatch: '#b3a0d5' },
  { id: 'dark', label: 'Modern Dark', mode: 'dark', swatch: '#3b82f6' },
  { id: 'slate', label: 'Deep Slate', mode: 'dark', swatch: '#38bdf8' },
  { id: 'midnight', label: 'Midnight Navy', mode: 'dark', swatch: '#818cf8' },
  { id: 'zinc', label: 'Graphite', mode: 'dark', swatch: '#a1a1aa' },
  { id: 'cyberpunk', label: 'Cyberpunk Violet', mode: 'dark', swatch: '#f472b6' },
  { id: 'monokai', label: 'Monokai', mode: 'dark', swatch: '#a3e635' },
];
export function resolveTheme(value: string | null, fallback: Theme = 'dark'): Theme {
  return THEMES.some(t => t.id === value) ? value as Theme : fallback;
}
export function themeClasses(theme: Theme): string[] {
  const mode = THEMES.find(t => t.id === theme)?.mode || 'dark';
  return theme === 'light' || theme === 'dark' ? [mode] : [mode, `theme-${theme}`];
}
