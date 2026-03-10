/**
 * Hub — Constructor de Mundos.
 * No persigas la IA. Construye un mundo que la necesite.
 * Reorganized into hierarchical sections: Core, Control, Experiences, Lab.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { PricingModal } from './PricingModal';
import { HubHero } from './Hub/HubHero';
import { HubPersonalSummary } from './Hub/HubPersonalSummary';
import { HubSection } from './Hub/HubSection';

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

function buildPillar(t, id, overrides = {}) {
  const base = {
    simulation: {
      icon: '🌍',
      title: t('hub.pillars.simulation_title'),
      subtitle: t('hub.pillars.simulation_subtitle'),
      description: t('hub.pillars.simulation_desc'),
      features: [t('hub.pillars.simulation_f1'), t('hub.pillars.simulation_f2'), t('hub.pillars.simulation_f3'), t('hub.pillars.simulation_f4')],
      color: '#00d4ff',
      bg: '#001a20',
      available: true,
      badge: t('hub.pillars.simulation_badge'),
    },
    missioncontrol: {
      icon: '🛰️',
      title: t('hub.pillars.missioncontrol_title'),
      subtitle: t('hub.pillars.missioncontrol_subtitle'),
      description: t('hub.pillars.missioncontrol_desc'),
      features: [t('hub.pillars.missioncontrol_f1'), t('hub.pillars.missioncontrol_f2'), t('hub.pillars.missioncontrol_f3'), t('hub.pillars.missioncontrol_f4')],
      color: '#00e676',
      bg: '#001a0d',
      available: true,
      badge: t('hub.pillars.missioncontrol_badge'),
    },
    minigames: {
      icon: '⚔️',
      title: t('hub.pillars.minigames_title'),
      subtitle: t('hub.pillars.minigames_subtitle'),
      description: t('hub.pillars.minigames_desc'),
      features: [t('hub.pillars.minigames_f1'), t('hub.pillars.minigames_f2'), t('hub.pillars.minigames_f3'), t('hub.pillars.minigames_f4')],
      color: '#7c3aed',
      bg: '#0d0520',
      available: true,
      badge: t('hub.pillars.minigames_badge'),
    },
    mysticquest: {
      icon: '🔮',
      title: t('hub.pillars.mysticquest_title'),
      subtitle: t('hub.pillars.mysticquest_subtitle'),
      description: t('hub.pillars.mysticquest_desc'),
      features: [t('hub.pillars.mysticquest_f1'), t('hub.pillars.mysticquest_f2'), t('hub.pillars.mysticquest_f3'), t('hub.pillars.mysticquest_f4')],
      color: '#a78bfa',
      bg: '#0f0a1a',
      available: true,
      badge: t('hub.pillars.mysticquest_badge'),
    },
    controltower: {
      icon: '🔭',
      title: 'AW Control Tower',
      subtitle: 'Auditoría técnica de repositorios',
      description: 'Ingiere un repositorio real, ejecuta especialistas de análisis y genera un dossier técnico-ejecutivo accionable.',
      features: ['Detección de stack automática', 'Análisis por 6 especialistas', 'Dossier técnico-ejecutivo', 'Riesgos priorizados'],
      color: '#06b6d4',
      bg: '#001a20',
      available: true,
      badge: 'MVP',
    },
    dobacksoft: {
      icon: '🚒',
      title: t('hub.pillars.dobacksoft_title'),
      subtitle: t('hub.pillars.dobacksoft_subtitle'),
      description: t('hub.pillars.dobacksoft_desc'),
      features: [t('hub.pillars.dobacksoft_f1'), t('hub.pillars.dobacksoft_f2'), t('hub.pillars.dobacksoft_f3'), t('hub.pillars.dobacksoft_f4')],
      color: '#f97316',
      bg: '#1c0800',
      available: true,
      badge: t('hub.pillars.dobacksoft_badge'),
    },
  };
  const def = base[id];
  if (!def) return null;
  return { id, ...def, ...overrides };
}

export function Hub({ onNavigate }) {
  const { t } = useTranslation();
  const [hero, setHero] = useState(null);
  const [status, setStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState(null);

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

  const activeWorld = hero?.aliveWorlds?.[0];
  const seedId = activeWorld?.civilizationSeed?.id;
  const seedAccent = seedId ? SEED_ACCENT[seedId] : null;

  const corePillars = [buildPillar(t, 'simulation')].filter(Boolean);
  const controlPillars = [buildPillar(t, 'missioncontrol'), buildPillar(t, 'controltower')].filter(Boolean);
  const experiencesPillars = [buildPillar(t, 'minigames'), buildPillar(t, 'mysticquest')].filter(Boolean);
  const labPillars = [buildPillar(t, 'dobacksoft')].filter(Boolean);

  return (
    <div className="hub" style={{ position: 'relative' }}>
      <HubHero />

      {checkoutMsg && (
        <div className="hub-checkout-success">
          <span>🌍 {checkoutMsg}</span>
          <button
            type="button"
            onClick={() => setCheckoutMsg(null)}
            style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <HubPersonalSummary
        hero={hero}
        status={status}
        subscription={subscription}
        seedAccent={seedAccent}
        activeWorld={activeWorld}
        onEnterWorld={() => onNavigate('simulation')}
        onUpgradePlan={() => setPricingOpen(true)}
      />

      <HubSection sectionTitle={t('hub.section_core')} pillars={corePillars} onNavigate={onNavigate} />
      <HubSection sectionTitle={t('hub.section_control')} pillars={controlPillars} onNavigate={onNavigate} />
      <HubSection sectionTitle={t('hub.section_experiences')} pillars={experiencesPillars} onNavigate={onNavigate} />
      <HubSection sectionTitle={t('hub.section_lab')} pillars={labPillars} onNavigate={onNavigate} />

      <footer className="hub-footer">
        <span>{t('hub.footer')}</span>
        <button type="button" className="hub-admin-link" onClick={() => onNavigate('docs')} title="Docs">
          {t('hub.docs')}
        </button>
        <button type="button" className="hub-admin-link" onClick={() => onNavigate('admin')} title="Admin">
          {t('hub.admin')}
        </button>
      </footer>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentTier={subscription?.tier ?? 'free'}
        onSubscribed={() => {
          setPricingOpen(false);
          fetchAll();
        }}
      />
    </div>
  );
}
