import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';

const KEY = 'react-vite-laravel.theme';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

export function useAppearance() {
  const [theme, setTheme] = React.useState<Theme>(() => getInitialTheme());
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    root.classList.toggle('dark', effectiveTheme === 'dark');
    localStorage.setItem(KEY, theme);
  }, [theme, systemTheme]);

  const toggleTheme = React.useCallback(
    (nextTheme?: Theme) => {
      if (nextTheme) {
        setTheme(nextTheme);
        return;
      }

      setTheme((currentTheme) => {
        const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme;
        return effectiveTheme === 'dark' ? 'light' : 'dark';
      });
    },
    [systemTheme],
  );

  return { theme, setTheme, toggleTheme };
}
