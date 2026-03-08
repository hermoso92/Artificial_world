/**
 * HeroRefugePanel — Constructor de Mundos.
 * Tu refugio, tu compañero IA, tus mundos.
 * Refugiarte. Habitar. Expandir. Pertenecer. Gobernar.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { MODE_COLORS, WORLD_TYPE_OPTIONS, BIOME_OPTIONS, inputStyle, btnStyle } from './HeroRefuge/constants';
import { AgentBubble } from './HeroRefuge/AgentBubble';
import { ModeGrid } from './HeroRefuge/ModeGrid';
import { WorldCard } from './HeroRefuge/WorldCard';
import { WorldDetailModal } from './HeroRefuge/WorldDetailModal';
import { PricingModal } from './PricingModal';

export function HeroRefugePanel() {
  const [hero, setHero] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [agentAnswer, setAgentAnswer] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ open: false, name: '', type: 'standard', biomes: ['forest'], scale: '' });
  const [createHeroForm, setCreateHeroForm] = useState({ open: false, name: '', title: '' });
  const [view, setView] = useState('agent');
  const [enteredWorldId, setEnteredWorldId] = useState(null);
  const [limitMsg, setLimitMsg] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const tickRef = useRef(null);

  const fetchHero = useCallback(async () => {
    try {
      const data = await api.getHero();
      setHero(data);
      setWorlds(data.aliveWorlds ?? []);
    } catch {
      // backend may not be ready yet
    }
  }, []);

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
      });
      setCreateForm((p) => ({ ...p, open: false, name: '' }));
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.accent, letterSpacing: '0.05em' }}>
            🌍 Tu Mundo
          </div>
          {hero && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
              {hero.name} · {hero.title}
            </div>
          )}
        </div>
        <button
          onClick={() => setCreateHeroForm((p) => ({ ...p, open: !p.open }))}
          style={{ ...btnStyle(colors.accent), fontSize: '10px', padding: '4px 8px' }}
        >
          {createHeroForm.open ? '✕' : '+ Constructor'}
        </button>
      </div>

      {/* Create hero form */}
      {createHeroForm.open && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input placeholder="Tu nombre" value={createHeroForm.name} onChange={(e) => setCreateHeroForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
          <input placeholder="Tu título (ej. Constructor de Mundos)" value={createHeroForm.title} onChange={(e) => setCreateHeroForm((p) => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <button onClick={handleCreateHero} disabled={loading} style={btnStyle(colors.accent)}>Empezar a construir</button>
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

          {/* Tab switcher */}
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

          {/* Agent view */}
          {view === 'agent' && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', marginBottom: '8px', fontSize: '11px' }}>
                <div style={{ color: colors.accent, fontWeight: 700, marginBottom: '4px' }}>{hero.agent?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>
                  Conversaciones: {hero.agent?.interactions ?? 0} · Recuerdos: {hero.agent?.memoryCount ?? 0}
                </div>
                {hero.agent?.recentMemory?.slice(0, 2).map((m, i) => (
                  <div key={i} style={{ marginTop: '3px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>› {m.event}</div>
                ))}
              </div>
              <AgentBubble message={agentAnswer} mode={hero.activeMode} />
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <input placeholder="Habla con tu compañero..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleQuery} disabled={loading || !query.trim()} style={btnStyle(colors.accent)}>➤</button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>PERSONALIDAD</div>
                {Object.entries(hero.agent?.traits ?? {}).map(([trait, val]) => (
                  <div key={trait} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', width: '90px' }}>{trait}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                      <div style={{ width: `${(val * 100).toFixed(0)}%`, height: '100%', background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}88)`, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', width: '28px', textAlign: 'right' }}>{(val * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worlds view */}
          {view === 'worlds' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  {worlds.length} {worlds.length === 1 ? 'mundo vivo' : 'mundos vivos'} · {hero.stats?.worldsCreated ?? 0} creados
                </div>
                <button onClick={() => setCreateForm((p) => ({ ...p, open: !p.open }))} style={btnStyle(colors.accent)}>
                  {createForm.open ? '✕' : '+ Mundo'}
                </button>
              </div>
              {createForm.open && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input placeholder="Dale un nombre a tu mundo" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
                  <select value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    {WORLD_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Elige el paisaje:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {BIOME_OPTIONS.map((b) => (
                      <button key={b.value} onClick={() => setCreateForm((p) => ({ ...p, biomes: p.biomes.includes(b.value) ? p.biomes.filter((x) => x !== b.value) : [...p.biomes, b.value] }))}
                        style={{
                          background: createForm.biomes.includes(b.value) ? `${colors.accent}33` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${createForm.biomes.includes(b.value) ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                          color: createForm.biomes.includes(b.value) ? colors.accent : 'rgba(255,255,255,0.4)',
                          borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace',
                        }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleCreateWorld} disabled={loading} style={btnStyle(colors.accent)}>Crear mi mundo</button>
                </div>
              )}
              {worlds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
                  Aún no has creado ningún mundo.<br />Empieza con el primero.
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {worlds.map((w) => <WorldCard key={w.id} world={w} onDestroy={handleDestroyWorld} onEnter={(world) => setEnteredWorldId(world.id)} />)}
                </div>
              )}
            </div>
          )}

          {/* Stats footer */}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
            <span>⏱ Tiempo: {hero.stats?.totalTicks ?? 0}</span>
            <span>🌍 Mundos: {hero.stats?.worldsCreated ?? 0}</span>
            <span>📜 Legado: {(hero.stats?.worldsCreated ?? 0) - (hero.stats?.worldsDestroyed ?? 0)}</span>
          </div>
        </>
      )}

      {limitMsg && (
        <div style={{
          marginTop: '10px',
          background: 'rgba(255,82,82,0.1)',
          border: '1px solid rgba(255,82,82,0.3)',
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '11px',
          color: '#ff8a80',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>{limitMsg}</span>
          <button
            onClick={() => { setLimitMsg(null); setPricingOpen(true); }}
            style={{
              ...btnStyle('#00d4ff'),
              whiteSpace: 'nowrap',
            }}
          >
            Mejorar plan
          </button>
        </div>
      )}

      <WorldDetailModal world={enteredWorld} onClose={() => setEnteredWorldId(null)} />
      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentTier="free"
        onSubscribed={() => { setPricingOpen(false); setLimitMsg(null); fetchHero(); }}
      />
    </div>
  );
}
