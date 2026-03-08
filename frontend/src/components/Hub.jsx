/**
 * Hub — Constructor de Mundos.
 * No persigas la IA. Construye un mundo que la necesite.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { PricingModal } from './PricingModal';
import { LanguageSelector } from './LanguageSelector';

const TIER_LABELS = {
  free: 'Explorador',
  constructor: 'Constructor',
  fundador: 'Fundador',
};

/** Acento visual por semilla de civilización (visualTone2d/3d). */
const SEED_ACCENT = {
  'spiritual-community': { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  'frontier-tribe': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  'technocrat-refuge': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  'warrior-kingdom': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  'merchant-city': { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  'paranoid-colony': { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  'decadent-empire': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  'tryndamere-champion': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  'synthesis-ai': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
};

export function Hub({ onNavigate }) {
  const { t } = useTranslation();
  const [hero, setHero] = useState(null);
  const [status, setStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState(null);

  const PILLARS = [
    {
      id: 'simulation',
      icon: '🌍',
      title: t('hub.pillars.simulation_title'),
      subtitle: t('hub.pillars.simulation_subtitle'),
      description: t('hub.pillars.simulation_desc'),
      features: [
        t('hub.pillars.simulation_f1'),
        t('hub.pillars.simulation_f2'),
        t('hub.pillars.simulation_f3'),
        t('hub.pillars.simulation_f4'),
      ],
      color: '#00d4ff',
      bg: '#001a20',
      available: true,
      badge: t('hub.pillars.simulation_badge'),
    },
    {
      id: 'minigames',
      icon: '⚔️',
      title: t('hub.pillars.minigames_title'),
      subtitle: t('hub.pillars.minigames_subtitle'),
      description: t('hub.pillars.minigames_desc'),
      features: [
        t('hub.pillars.minigames_f1'),
        t('hub.pillars.minigames_f2'),
        t('hub.pillars.minigames_f3'),
        t('hub.pillars.minigames_f4'),
      ],
      color: '#7c3aed',
      bg: '#0d0520',
      available: true,
    },
    {
      id: 'dobacksoft',
      icon: '🚒',
      title: t('hub.pillars.dobacksoft_title'),
      subtitle: t('hub.pillars.dobacksoft_subtitle'),
      description: t('hub.pillars.dobacksoft_desc'),
      features: [
        t('hub.pillars.dobacksoft_f1'),
        t('hub.pillars.dobacksoft_f2'),
        t('hub.pillars.dobacksoft_f3'),
        t('hub.pillars.dobacksoft_f4'),
      ],
      color: '#f97316',
      bg: '#1c0800',
      available: true,
      badge: t('hub.pillars.dobacksoft_badge'),
    },
    {
      id: 'missioncontrol',
      icon: '🛰️',
      title: t('hub.pillars.missioncontrol_title'),
      subtitle: t('hub.pillars.missioncontrol_subtitle'),
      description: t('hub.pillars.missioncontrol_desc'),
      features: [
        t('hub.pillars.missioncontrol_f1'),
        t('hub.pillars.missioncontrol_f2'),
        t('hub.pillars.missioncontrol_f3'),
        t('hub.pillars.missioncontrol_f4'),
      ],
      color: '#00e676',
      bg: '#001a0d',
      available: true,
    },
    {
      id: 'mysticquest',
      icon: '🔮',
      title: t('hub.pillars.mysticquest_title'),
      subtitle: t('hub.pillars.mysticquest_subtitle'),
      description: t('hub.pillars.mysticquest_desc'),
      features: [
        t('hub.pillars.mysticquest_f1'),
        t('hub.pillars.mysticquest_f2'),
        t('hub.pillars.mysticquest_f3'),
        t('hub.pillars.mysticquest_f4'),
      ],
      color: '#a78bfa',
      bg: '#0f0a1a',
      available: true,
      badge: t('hub.pillars.mysticquest_badge'),
    },
  ];

  const fetchAll = () => {
    api.getHero().then(setHero).catch(() => {});
    api.getStatus().then(setStatus).catch(() => {});
    api.getMySubscription().then(setSubscription).catch(() => {});
  };

  useEffect(() => {
    fetchAll();
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    if (params.get('checkout') === 'success') {
      const tier = params.get('tier') ?? 'constructor';
      setCheckoutMsg(tier === 'fundador' ? t('hub.checkout_success_fundador') : t('hub.checkout_success_constructor'));
      window.location.hash = '';
    }
  }, []);

  const worldCount = hero?.aliveWorlds?.length ?? 0;
  const heroName = hero?.name;
  const modeName = hero?.modes?.find((m) => m.id === hero?.activeMode)?.label ?? hero?.activeMode;
  const activeWorld = hero?.aliveWorlds?.[0];
  const seedId = activeWorld?.civilizationSeed?.id;
  const seedAccent = seedId ? SEED_ACCENT[seedId] : null;

  return (
    <div className="hub" style={{ position: 'relative' }}>
      <LanguageSelector variant="hub" />

      <div className="hub-hero">
        <p className="hub-manifesto">{t('hub.manifesto')}</p>
        <h1 className="hub-title">
          <span className="hub-title-accent">{t('hub.title_accent')}</span> {t('hub.title')}
        </h1>
        <p className="hub-subtitle">{t('hub.subtitle')}</p>
      </div>

      {checkoutMsg && (
        <div className="hub-checkout-success">
          <span>🌍 {checkoutMsg}</span>
          <button onClick={() => setCheckoutMsg(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      <div
        className="hub-personal"
        style={seedAccent ? { '--seed-accent': seedAccent.color, '--seed-bg': seedAccent.bg } : undefined}
      >
        {seedAccent && activeWorld?.civilizationSeed?.label && (
          <span className="hub-seed-badge" style={{ background: seedAccent.bg, color: seedAccent.color }}>
            {activeWorld.civilizationSeed.label}
          </span>
        )}
        <div className="hub-personal-greeting">
          {heroName ? (
            <>{t('hub.welcome_prefix', 'Bienvenido, ')} <strong>{heroName}</strong></>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: t('hub.no_world') }} />
          )}
        </div>
        {(heroName || worldCount > 0 || status) && (
          <div className="hub-personal-stats">
            <span className="hub-stat">
              {t('hub.stat_worlds', { count: worldCount })}
            </span>
            {modeName && (
              <span className="hub-stat">
                {t('hub.stat_scale', { mode: modeName })}
              </span>
            )}
            {status && (
              <span className="hub-stat">
                {t('hub.stat_inhabitants', { count: status.agentCount ?? 0 })}
              </span>
            )}
          </div>
        )}
        <div className="hub-personal-actions">
          <button
            className="hub-personal-cta"
            onClick={() => onNavigate('simulation')}
          >
            {t('hub.enter_world')}
          </button>
          {subscription && (
            <button
              className="hub-plan-btn"
              onClick={() => setPricingOpen(true)}
            >
              {subscription.tier === 'free'
                ? t('hub.upgrade_plan')
                : `✓ ${TIER_LABELS[subscription.tier] ?? subscription.tier}`}
            </button>
          )}
        </div>
      </div>

      <div className="hub-grid">
        {PILLARS.map((pillar) => (
          <button
            key={pillar.id}
            className={`pillar-card ${!pillar.available ? 'pillar-card--disabled' : ''}`}
            style={{ '--pillar-color': pillar.color, '--pillar-bg': pillar.bg }}
            onClick={() => pillar.available && onNavigate(pillar.id)}
            aria-label={`${t('hub.enter_arrow')} ${pillar.title}`}
          >
            {pillar.badge && (
              <span className="pillar-badge">{pillar.badge}</span>
            )}
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
            {pillar.available && (
              <div className="pillar-cta">{t('hub.enter_arrow')}</div>
            )}
          </button>
        ))}
      </div>

      <footer className="hub-footer">
        <span>{t('hub.footer')}</span>
        <a href="#docs" className="hub-admin-link" title="Docs">{t('hub.docs')}</a>
        <a href="#admin" className="hub-admin-link" title="Admin">{t('hub.admin')}</a>
      </footer>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentTier={subscription?.tier ?? 'free'}
        onSubscribed={() => { setPricingOpen(false); fetchAll(); }}
      />
    </div>
  );
}
