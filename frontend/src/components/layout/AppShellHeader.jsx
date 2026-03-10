/**
 * AppShellHeader — Global header for ecosystem routes.
 * Brand, Hub link, and consistent identity.
 */
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../LanguageSelector';

export function AppShellHeader({ onNavigate, currentRoute }) {
  const { t } = useTranslation();

  return (
    <header className="app-shell-header">
      <div className="app-shell-header-inner">
        <button
          type="button"
          className="app-shell-brand"
          onClick={() => onNavigate('hub')}
          aria-label={t('hub.title_accent', 'Constructor')}
        >
          <span className="app-shell-brand-dot" />
          <span className="app-shell-brand-text">
            {t('hub.title_accent', 'Constructor')} {t('hub.title', 'de Mundos')}
          </span>
        </button>
        <nav className="app-shell-nav">
          <button
            type="button"
            className={`app-shell-nav-item ${currentRoute === 'hub' ? 'app-shell-nav-item--active' : ''}`}
            onClick={() => onNavigate('hub')}
          >
            {t('hub.title_accent', 'Hub')}
          </button>
        </nav>
        <div className="app-shell-header-right">
          <LanguageSelector variant="hub" />
        </div>
      </div>
    </header>
  );
}
