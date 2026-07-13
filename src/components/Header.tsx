import { AppLogo } from './AppLogo';
import { HeaderActions } from './HeaderActions';

export function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <AppLogo size="sm" />
        <div>
          <h1>Kyanban</h1>
          <p className="header-subtitle">Daily activity tracker</p>
        </div>
      </div>
      <HeaderActions />
    </header>
  );
}
