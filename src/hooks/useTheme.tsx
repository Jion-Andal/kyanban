import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { storageGet, storageSet } from '../utils/platformStorage';

const THEME_KEY = 'kyanban_theme';

export type Theme = 'light' | 'dark' | 'sea';

const THEMES: Theme[] = ['light', 'dark', 'sea'];

function isTheme(value: string | null): value is Theme {
  return value !== null && THEMES.includes(value as Theme);
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storageGet(THEME_KEY).then((value) => {
      const initial = isTheme(value) ? value : 'light';
      setTheme(initial);
      applyTheme(initial);
      setReady(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const index = THEMES.indexOf(current);
      const next = THEMES[(index + 1) % THEMES.length];
      applyTheme(next);
      void storageSet(THEME_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
