/**
 * Hub — Constructor de Mundos.
 * No persigas la IA. Construye un mundo que la necesite.
 */
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PricingModal } from './PricingModal';

const TIER_LABELS = {
  free: 'Explorador',
  constructor: 'Constructor',
  fundador: 'Fundador',
};

const PILLARS = [
  {
    id: 'simulation',
    icon: '🌍',
    title: 'Tu Mundo',
    subtitle: 'Crea. Habita. Expande.',
    description: 'Construye un refugio, dale vida con habitantes que piensan y sienten, y observa cómo crece hasta convertirse en algo que no esperabas.',
    features: ['Crea tu refugio', 'Habitantes con memoria', 'De refugio a aldea a ciudad', 'Tu mundo, tus reglas'],
    color: '#00d4ff',
    bg: '#001a20',
    available: true,
    badge: 'Demo web',
  },
  {
    id: 'minigames',
    icon: '⚔️',
    title: 'Arena',
    subtitle: 'Desafía a tus habitantes',
    description: 'Reta a otros jugadores o a los habitantes de tu mundo. Ellos aprenden, recuerdan y se adaptan a tu forma de jugar.',
    features: ['3 en raya contra tu IA', 'Damas (próximamente)', 'Ajedrez (próximamente)', 'Rivales que evolucionan'],
    color: '#7c3aed',
    bg: '#0d0520',
    available: true,
  },
  {
    id: 'dobacksoft',
    icon: '🚒',
    title: 'Emergencias',
    subtitle: 'Protege tu comunidad',
    description: 'Conduce hasta la emergencia. Tu comunidad depende de ti. Cada decisión importa, cada segundo cuenta.',
    features: ['Misiones de rescate', 'Tu vehículo, tu ruta', 'Escenarios reales', 'Protege lo que construiste'],
    color: '#f97316',
    bg: '#1c0800',
    available: true,
    badge: 'Acceso anticipado',
  },
  {
    id: 'missioncontrol',
    icon: '🛰️',
    title: 'Observatorio',
    subtitle: 'Mira tu mundo desde arriba',
    description: 'Observa en tiempo real cómo viven tus habitantes. Quién prospera, quién lucha, qué pasa cuando no miras.',
    features: ['Vista en vivo', 'Quién hace qué', 'Eventos del mundo', 'Historia de tu civilización'],
    color: '#00e676',
    bg: '#001a0d',
    available: true,
  },
];

export function Hub({ onNavigate }) {
  const [hero, setHero] = useState(null);
  const [status, setStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);

  const fetchAll = () => {
    api.getHero().then(setHero).catch(() => {});
    api.getStatus().then(setStatus).catch(() => {});
    api.getMySubscription().then(setSubscription).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const worldCount = hero?.aliveWorlds?.length ?? 0;
  const heroName = hero?.name;
  const modeName = hero?.modes?.find((m) => m.id === hero?.activeMode)?.label ?? hero?.activeMode;

  return (
    <div className="hub">
      <div className="hub-hero">
        <p className="hub-manifesto">No persigas la IA. Construye un mundo que la necesite.</p>
        <h1 className="hub-title">
          <span className="hub-title-accent">Constructor</span> de Mundos
        </h1>
        <p className="hub-subtitle">Refugiarte. Habitar. Expandir. Pertenecer. Gobernar.</p>
      </div>

      {heroName && (
        <div className="hub-personal">
          <div className="hub-personal-greeting">
            Bienvenido, <strong>{heroName}</strong>
          </div>
          <div className="hub-personal-stats">
            <span className="hub-stat">
              🌍 {worldCount} {worldCount === 1 ? 'mundo' : 'mundos'}
            </span>
            {modeName && (
              <span className="hub-stat">
                🔭 Escala: {modeName}
              </span>
            )}
            {status && (
              <span className="hub-stat">
                👥 {status.agentCount ?? 0} habitantes
              </span>
            )}
          </div>
          <div className="hub-personal-actions">
            <button
              className="hub-personal-cta"
              onClick={() => onNavigate('simulation')}
            >
              Entrar en tu mundo →
            </button>
            {subscription && (
              <button
                className="hub-plan-btn"
                onClick={() => setPricingOpen(true)}
              >
                {subscription.tier === 'free'
                  ? '⭐ Mejorar plan'
                  : `✓ ${TIER_LABELS[subscription.tier] ?? subscription.tier}`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="hub-grid">
        {PILLARS.map((pillar) => (
          <button
            key={pillar.id}
            className={`pillar-card ${!pillar.available ? 'pillar-card--disabled' : ''}`}
            style={{ '--pillar-color': pillar.color, '--pillar-bg': pillar.bg }}
            onClick={() => pillar.available && onNavigate(pillar.id)}
            aria-label={`Ir a ${pillar.title}`}
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
              <div className="pillar-cta">Entrar →</div>
            )}
          </button>
        ))}
      </div>

      <footer className="hub-footer">
        <span>Constructor de Mundos · Crea tu refugio · Hazlo crecer · Invita a tu gente</span>
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
