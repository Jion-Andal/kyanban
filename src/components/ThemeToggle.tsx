import { useTheme, type Theme } from '../hooks/useTheme';

const NEXT_LABEL: Record<Theme, string> = {
  light: 'dark',
  dark: 'sea',
  sea: 'light',
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${NEXT_LABEL[theme]} mode`}
      title={`Switch to ${NEXT_LABEL[theme]} mode`}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      ) : theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M2 13c1.2-.8 2.4-1.2 3.6-1.2 1.2 0 2.4.4 3.6 1.2 1.2.8 2.4 1.2 3.6 1.2s2.4-.4 3.6-1.2c1.2-.8 2.4-1.2 3.6-1.2 1.2 0 2.4.4 3.6 1.2V16c-1.2-.8-2.4-1.2-3.6-1.2-1.2 0-2.4.4-3.6 1.2-1.2.8-2.4 1.2-3.6 1.2s-2.4-.4-3.6-1.2c-1.2-.8-2.4-1.2-3.6-1.2-1.2 0-2.4.4-3.6 1.2V13z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z" />
        </svg>
      )}
    </button>
  );
}
