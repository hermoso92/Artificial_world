/**
 * Landing — Onboarding flow for new users.
 * Steps: choose world → name your hero → name your refuge → welcome screen.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { CIVILIZATION_SEED_OPTIONS } from './HeroRefuge/constants';
import { LanguageSelector } from './LanguageSelector';

export function Landing({ onEnter }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('world');
  const [name, setName] = useState('');
  const [refugeName, setRefugeName] = useState('');
  const [civilizationSeedId, setCivilizationSeedId] = useState('frontier-tribe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('refuge');
  };

  const defaultRefugeName = CIVILIZATION_SEED_OPTIONS.find((s) => s.value === civilizationSeedId)?.defaultRefugeName ?? 'Mi refugio';
  const effectiveRefugeName = refugeName.trim() || defaultRefugeName;

  const handleRefugeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createHero(name.trim(), 'Constructor de Mundos');
      await api.createRefuge(effectiveRefugeName);
      await api.createHeroWorld({
        name: `${effectiveRefugeName} · Civilizacion naciente`,
        refugeName: effectiveRefugeName,
        civilizationSeedId,
      });
      setStep('ready');
    } catch (err) {
      setError(err?.message ?? t('landing.error_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-bg" />
      <LanguageSelector variant="landing" />

      {step === 'world' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">{t('landing.step1_num')}</p>
          <h2 className="landing-step-title">{t('landing.step1_title')}</h2>
          <p className="landing-step-desc">{t('landing.step1_desc')}</p>
          <div className="landing-options" style={{ display: 'grid', gap: '10px' }}>
            {CIVILIZATION_SEED_OPTIONS.map((seed) => (
              <button
                key={seed.value}
                type="button"
                className={`landing-option ${civilizationSeedId === seed.value ? 'active' : ''}`}
                onClick={() => {
                  setCivilizationSeedId(seed.value);
                  setStep('name');
                }}
              >
                <span className="landing-option-icon">🏛️</span>
                <span>{seed.label}</span>
                <small style={{ display: 'block', opacity: 0.7 }}>{seed.tone}</small>
              </button>
            ))}
          </div>
          <button className="landing-skip" onClick={onEnter}>
            {t('landing.already_have_world')}
          </button>
        </div>
      )}

      {step === 'name' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">{t('landing.step2_num')}</p>
          <h2 className="landing-step-title">{t('landing.step2_title')}</h2>
          <p className="landing-step-desc">{t('landing.step2_desc')}</p>
          <form onSubmit={handleNameSubmit} className="landing-form">
            <input
              className="landing-input"
              type="text"
              placeholder={t('landing.placeholder_name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={30}
            />
            <div className="landing-actions">
              <button type="button" className="landing-back" onClick={() => setStep('world')}>
                {t('landing.change_seed')}
              </button>
              <button className="landing-cta" type="submit" disabled={!name.trim()}>
                {t('landing.continue')}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'refuge' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">{t('landing.step3_num')}</p>
          <h2 className="landing-step-title">{t('landing.step3_title')}</h2>
          <p className="landing-step-desc">
            {t('landing.step3_desc')} <em>{defaultRefugeName}</em>
          </p>
          <form onSubmit={handleRefugeSubmit} className="landing-form">
            <input
              className="landing-input"
              type="text"
              placeholder={defaultRefugeName}
              value={refugeName}
              onChange={(e) => setRefugeName(e.target.value)}
              autoFocus
              maxLength={40}
            />
            {error && <p className="landing-error">{error}</p>}
            <div className="landing-actions">
              <button type="button" className="landing-back" onClick={() => setStep('name')}>
                {t('landing.back')}
              </button>
              <button className="landing-cta" type="submit" disabled={loading}>
                {loading ? t('landing.building') : t('landing.create_refuge')}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'ready' && (
        <div className="landing-panel landing-ready">
          <div className="landing-ready-icon">🌍</div>
          <h2 className="landing-step-title">{t('landing.ready_title', { name })}</h2>
          <p className="landing-step-desc">
            {t('landing.ready_desc_before')}
            <strong>{effectiveRefugeName}</strong>
            {t('landing.ready_desc_after')}
          </p>
          <div className="landing-tips">
            <span>{t('landing.tip_bed')}</span>
            <span>{t('landing.tip_table')}</span>
            <span>{t('landing.tip_sofa')}</span>
          </div>
          <button className="landing-cta landing-cta-glow" onClick={onEnter}>
            {t('landing.enter_world')}
          </button>
          <p className="landing-step-desc" style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.85 }}>
            {t('landing.enter_world_hint', 'Desde el Hub accedes a Tu Mundo, Arena, Mission Control y más.')}
          </p>
        </div>
      )}

      <footer className="landing-footer">
        <span>{t('landing.footer_brand')}</span>
        <span className="landing-footer-dot">·</span>
        <span>{t('landing.footer_tagline')}</span>
      </footer>
    </div>
  );
}
