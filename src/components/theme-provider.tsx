import * as React from 'react';
import { THEMES, resolveTheme, themeClasses } from '@/lib/themes';
import type { Theme } from '@/types';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'tasky-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try { return resolveTheme(localStorage.getItem(storageKey), defaultTheme); }
    catch { return defaultTheme; }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark', ...THEMES.map(t => `theme-${t.id}`));
    root.classList.add(...themeClasses(theme));
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        try { localStorage.setItem(storageKey, newTheme); } catch { /* Apply even when storage is unavailable. */ }
        setTheme(newTheme);
      },
    }),
    [theme, storageKey]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
