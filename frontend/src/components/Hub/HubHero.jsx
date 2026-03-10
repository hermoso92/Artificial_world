/**
 * HubHero — Manifesto and title block for the Hub.
 */
import { useTranslation } from 'react-i18next';

export function HubHero() {
  const { t } = useTranslation();

  return (
    <div className="hub-hero">
      <p className="hub-manifesto">{t('hub.manifesto')}</p>
      <h1 className="hub-title">
        <span className="hub-title-accent">{t('hub.title_accent')}</span> {t('hub.title')}
      </h1>
      <p className="hub-subtitle">{t('hub.subtitle')}</p>
    </div>
  );
}
