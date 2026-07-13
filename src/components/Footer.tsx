export type AppPage = 'dashboard' | 'backlog' | 'kanban';

interface FooterProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function Footer({ currentPage, onNavigate }: FooterProps) {
  return (
    <footer className="app-footer" role="navigation" aria-label="Main navigation">
      <button
        type="button"
        className={`footer-nav-btn${currentPage === 'backlog' ? ' active' : ''}`}
        onClick={() => onNavigate('backlog')}
        aria-label="Backlog"
        aria-current={currentPage === 'backlog' ? 'page' : undefined}
      >
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <span>Backlog</span>
      </button>

      <div className="footer-nav-center">
        <button
          type="button"
          className={`footer-nav-btn footer-nav-btn--dashboard${currentPage === 'dashboard' ? ' active' : ''}`}
          onClick={() => onNavigate('dashboard')}
          aria-label="Dashboard"
          aria-current={currentPage === 'dashboard' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
          </svg>
        </button>
        <span className={`footer-nav-center-label${currentPage === 'dashboard' ? ' active' : ''}`}>
          Dashboard
        </span>
      </div>

      <button
        type="button"
        className={`footer-nav-btn${currentPage === 'kanban' ? ' active' : ''}`}
        onClick={() => onNavigate('kanban')}
        aria-label="Kanban board"
        aria-current={currentPage === 'kanban' ? 'page' : undefined}
      >
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="3" width="5" height="18" rx="1" />
          <rect x="10" y="3" width="5" height="12" rx="1" />
          <rect x="17" y="3" width="5" height="15" rx="1" />
        </svg>
        <span>Kanban</span>
      </button>
    </footer>
  );
}
