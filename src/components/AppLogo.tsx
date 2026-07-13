interface AppLogoProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function AppLogo({ size = 'sm', className = '' }: AppLogoProps) {
  return (
    <div
      className={`app-logo app-logo--${size}${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      <span className="app-logo__column app-logo__column--todo" />
      <span className="app-logo__column app-logo__column--in-progress" />
      <span className="app-logo__column app-logo__column--blocked" />
      <span className="app-logo__column app-logo__column--done" />
    </div>
  );
}
