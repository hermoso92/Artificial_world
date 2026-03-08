/**
 * HeroRefugePanel — Constructor de Mundos.
 * Tu refugio, tu compañero IA, tus mundos.
 * Refugiarte. Habitar. Expandir. Pertenecer. Gobernar.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import {
  MODE_COLORS,
  CIVILIZATION_SEED_OPTIONS,
  btnStyle,
} from './HeroRefuge/constants';
import { ModeGrid } from './HeroRefuge/ModeGrid';
import { HeroRefugeHeader } from './HeroRefuge/HeroRefugeHeader';
import { HeroRefugeAgentView } from './HeroRefuge/HeroRefugeAgentView';
import { HeroRefugeWorldsView } from './HeroRefuge/HeroRefugeWorldsView';
import { HeroRefugeLimitBanner } from './HeroRefuge/HeroRefugeLimitBanner';
import { WorldDetailModal } from './HeroRefuge/WorldDetailModal';
import { HeroPresentationCard } from './HeroRefuge/HeroPresentationCard';
import { PricingModal } from './PricingModal';

export function HeroRefugePanel({ heroData, onHeroUpdate, onEnterWorld }) {
  const [hero, setHero] = useState(heroData ?? null);
  const [worlds, setWorlds] = useState([]);
  const [agentAnswer, setAgentAnswer] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    open: false,
    name: '',
    type: 'standard',
    biomes: ['forest'],
    scale: '',
    civilizationSeedId: 'frontier-tribe',
    refugeName: '',
  });
  const [createHeroForm, setCreateHeroForm] = useState({ open: false, name: '', title: '' });
  const [view, setView] = useState('agent');
  const [enteredWorldId, setEnteredWorldId] = useState(null);
  const [limitMsg, setLimitMsg] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [heroPresentationOpen, setHeroPresentationOpen] = useState(false);
  const [civilizationSeeds, setCivilizationSeeds] = useState(CIVILIZATION_SEED_OPTIONS);
  const tickRef = useRef(null);

  const fetchHero = useCallback(async () => {
    try {
      const data = await api.getHero();
      setHero(data);
      setWorlds(data.aliveWorlds ?? []);
      if (onHeroUpdate) onHeroUpdate(data);
    } catch {
      // backend may not be ready yet
    }
  }, [onHeroUpdate]);

  useEffect(() => {
    if (heroData && !hero) {
      setHero(heroData);
      setWorlds(heroData.aliveWorlds ?? []);
    }
  }, [heroData, hero]);

  useEffect(() => {
    fetchHero();
    tickRef.current = setInterval(async () => {
      if (worlds.length > 0) {
        await api.tickHeroWorlds().catch(() => {});
        await fetchHero();
      }
    }, 3000);
    return () => clearInterval(tickRef.current);
  }, [fetchHero, worlds.length]);

  useEffect(() => {
    api.getHeroCivilizationSeeds()
      .then((seeds) => {
        if (Array.isArray(seeds) && seeds.length > 0) {
          setCivilizationSeeds(seeds.map((seed) => ({
            value: seed.id,
            label: seed.label,
            tone: `${seed.values?.join(', ') ?? ''} · ${seed.conflictStyle ?? ''}`,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchMode = async (modeId) => {
    setLoading(true);
    try { await api.switchHeroMode(modeId); await fetchHero(); }
    finally { setLoading(false); }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const resp = await api.queryHeroAgent(query.trim(), { worldCount: worlds.length });
      setAgentAnswer(resp.answer ?? '');
      setQuery('');
    } finally { setLoading(false); }
  };

  const handleCreateWorld = async () => {
    setLoading(true);
    setLimitMsg(null);
    try {
      await api.createHeroWorld({
        name: createForm.name || `World-${Date.now()}`,
        type: createForm.type,
        biomes: createForm.biomes,
        scale: createForm.scale || hero?.activeMode,
        civilizationSeedId: createForm.civilizationSeedId,
        refugeName: createForm.refugeName,
      });
      setCreateForm((p) => ({
        ...p,
        open: false,
        name: '',
        refugeName: '',
        civilizationSeedId: 'frontier-tribe',
      }));
      await fetchHero();
    } catch (err) {
      if (err.message?.includes('plan') || err.message?.includes('Mejora')) {
        setLimitMsg(err.message);
      }
    } finally { setLoading(false); }
  };

  const handleDestroyWorld = async (worldId) => {
    setLoading(true);
    try {
      await api.destroyHeroWorld(worldId);
      if (enteredWorldId === worldId) setEnteredWorldId(null);
      await fetchHero();
    } finally { setLoading(false); }
  };

  const enteredWorld = enteredWorldId ? worlds.find((w) => w.id === enteredWorldId) : null;
  useEffect(() => {
    if (enteredWorldId && !enteredWorld) setEnteredWorldId(null);
  }, [enteredWorldId, enteredWorld]);

  const handleCreateHero = async () => {
    setLoading(true);
    try {
      await api.createHero(createHeroForm.name || 'Constructor', createHeroForm.title || 'Constructor de Mundos');
      setCreateHeroForm({ open: false, name: '', title: '' });
      await fetchHero();
    } finally { setLoading(false); }
  };

  const colors = MODE_COLORS[hero?.activeMode ?? 'refugio'];

  return (
    <div style={{
      background: `linear-gradient(180deg, ${colors.bg} 0%, #0a0a0f 100%)`,
      border: `1px solid ${colors.accent}44`,
      borderRadius: '14px',
      padding: '14px',
      fontFamily: 'monospace',
      color: '#fff',
      transition: 'all 0.3s ease',
    }}>
      <HeroRefugeHeader
        hero={hero}
        createHeroForm={createHeroForm}
        setCreateHeroForm={setCreateHeroForm}
        handleCreateHero={handleCreateHero}
        loading={loading}
        colors={colors}
      />

      {hero && (
        <div style={{ marginBottom: '8px', textAlign: 'right' }}>
          <button
            onClick={() => setHeroPresentationOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)',
              borderRadius: '5px',
              padding: '3px 9px',
              cursor: 'pointer',
              fontSize: '9px',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            ⚔️🧠 Héroes de la Comunidad
          </button>
        </div>
      )}

      {hero && (
        <>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
            ESCALA · <span style={{ color: colors.accent }}>
              {hero.modes?.find((m) => m.id === hero.activeMode)?.icon} {hero.modes?.find((m) => m.id === hero.activeMode)?.label?.toUpperCase() ?? hero.activeMode?.toUpperCase()}
            </span>
          </div>
          <ModeGrid modes={hero.modes ?? []} activeMode={hero.activeMode} onSelect={handleSwitchMode} />

          <div style={{ display: 'flex', gap: '4px', marginTop: '12px', marginBottom: '6px' }}>
            {[['agent', '🤝 Compañero'], ['worlds', '🌍 Mis Mundos']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1,
                background: view === v ? `${colors.accent}33` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${view === v ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                color: view === v ? colors.accent : 'rgba(255,255,255,0.5)',
                borderRadius: '6px', padding: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace',
              }}>
                {label}
              </button>
            ))}
          </div>

          {view === 'agent' && (
            <HeroRefugeAgentView
              hero={hero}
              agentAnswer={agentAnswer}
              query={query}
              setQuery={setQuery}
              handleQuery={handleQuery}
              loading={loading}
              colors={colors}
            />
          )}

          {view === 'worlds' && (
            <HeroRefugeWorldsView
              hero={hero}
              worlds={worlds}
              createForm={createForm}
              setCreateForm={setCreateForm}
              civilizationSeeds={civilizationSeeds}
              handleCreateWorld={handleCreateWorld}
              handleDestroyWorld={handleDestroyWorld}
              setEnteredWorldId={setEnteredWorldId}
              loading={loading}
              colors={colors}
            />
          )}

          {hero.simulation && (
            <div style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '9px',
              color: 'rgba(255,255,255,0.35)',
            }}>
              <span style={{ color: hero.simulation.running ? '#00e676' : 'rgba(255,255,255,0.25)' }}>
                {hero.simulation.running ? '● Vivo' : '○ Pausado'}
              </span>
              <span>👥 {hero.simulation.agentCount} habitantes</span>
              <span>🏘️ {hero.simulation.refugeCount} refugios</span>
              <span>⏱ Tick {hero.simulation.tick}</span>
            </div>
          )}

          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
            <span>⏱ Tiempo: {hero.stats?.totalTicks ?? 0}</span>
            <span>🌍 Mundos: {hero.stats?.worldsCreated ?? 0}</span>
            <span>📜 Legado: {(hero.stats?.worldsCreated ?? 0) - (hero.stats?.worldsDestroyed ?? 0)}</span>
          </div>
        </>
      )}

      <HeroRefugeLimitBanner
        limitMsg={limitMsg}
        onUpgrade={() => { setLimitMsg(null); setPricingOpen(true); }}
      />

      <WorldDetailModal
        world={enteredWorld}
        onClose={() => setEnteredWorldId(null)}
        onEnter={onEnterWorld ? (w) => { onEnterWorld(w); setEnteredWorldId(null); } : undefined}
      />
      <HeroPresentationCard
        open={heroPresentationOpen}
        onClose={() => setHeroPresentationOpen(false)}
      />
      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentTier="free"
        onSubscribed={() => { setPricingOpen(false); setLimitMsg(null); fetchHero(); }}
      />
    </div>
  );
}
