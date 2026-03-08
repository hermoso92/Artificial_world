import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'pt', label: 'PT', name: 'Português' },
];

export function LanguageSelector({ variant = 'default' }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language?.slice(0, 2) || 'es';

  const handleChange = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className={`lang-selector lang-selector--${variant}`} role="group" aria-label="Language">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`lang-btn ${current === lang.code ? 'lang-btn--active' : ''}`}
          onClick={() => handleChange(lang.code)}
          title={lang.name}
          aria-pressed={current === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
