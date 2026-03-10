/**
 * HubCard — Single pillar/card for a module entry point.
 */
import { useTranslation } from 'react-i18next';

export function HubCard({ pillar, onNavigate }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`pillar-card ${!pillar.available ? 'pillar-card--disabled' : ''}`}
      style={{ '--pillar-color': pillar.color, '--pillar-bg': pillar.bg }}
      onClick={() => pillar.available && onNavigate(pillar.id)}
      aria-label={`${t('hub.enter_arrow')} ${pillar.title}`}
    >
      {pillar.badge && <span className="pillar-badge">{pillar.badge}</span>}
      <div className="pillar-icon">{pillar.icon}</div>
      <div className="pillar-body">
        <div className="pillar-title">{pillar.title}</div>
        <div className="pillar-subtitle">{pillar.subtitle}</div>
        <p className="pillar-desc">{pillar.description}</p>
        <ul className="pillar-features">
          {pillar.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      {pillar.available && <div className="pillar-cta">{t('hub.enter_arrow')}</div>}
    </button>
  );
}
