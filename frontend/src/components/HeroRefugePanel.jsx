/**
 * HeroRefugePanel — El refugio del héroe con agente IA personal.
 * Permite crear/destruir mundos artificiales persistentes
 * y operar en 13 modos de escala.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const MODE_COLORS = {
  personal:     { bg: '#1a1a2e', accent: '#e94560', text: '#fff' },
  empresa:      { bg: '#0f3460', accent: '#16213e', text: '#a8dadc' },
  comunidad:    { bg: '#1b4332', accent: '#40916c', text: '#d8f3dc' },
  hogar:        { bg: '#3d1c02', accent: '#e85d04', text: '#ffddd2' },
  cuarto:       { bg: '#2d1b69', accent: '#7b2d8b', text: '#e0aaff' },
  refugio:      { bg: '#0a1628', accent: '#4cc9f0', text: '#caf0f8' },
  ecosistema:   { bg: '#0d2818', accent: '#52b788', text: '#b7e4c7' },
  planeta:      { bg: '#03045e', accent: '#0077b6', text: '#90e0ef' },
  mundo:        { bg: '#1a0533', accent: '#7209b7', text: '#d7b4fe' },
  galaxia:      { bg: '#03001c', accent: '#9b72cf', text: '#e2c9ff' },
  persistencia: { bg: '#0d0221', accent: '#ff6b6b', text: '#ffe0e0' },
  ia:           { bg: '#001e26', accent: '#00f5d4', text: '#b2ffe6' },
  nexo:         { bg: '#1c0e00', accent: '#ffd60a', text: '#fff3b0' },
};

const WORLD_TYPE_OPTIONS = ['standard', 'void', 'crystalline', 'organic', 'digital', 'temporal'];
const BIOME_OPTIONS = ['forest', 'plains', 'ocean', 'desert', 'tundra', 'volcanic', 'nebula', 'quantum'];

function AgentBubble({ message, mode }) {
  const colors = MODE_COLORS[mode] ?? MODE_COLORS.refugio;
  if (!message) return null;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.bg}, ${colors.accent}22)`,
      border: `1px solid ${colors.accent}44`,
      borderRadius: '12px',
      padding: '10px 14px',
      marginTop: '8px',
      fontSize: '12px',
      color: colors.text,
      fontStyle: 'italic',
      lineHeight: 1.5,
    }}>
      <span style={{ color: colors.accent, fontWeight: 700, fontStyle: 'normal' }}>
        Companion:
      </span>{' '}
      {message}
    </div>
  );
}

function ModeGrid({ modes, activeMode, onSelect }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '4px',
      marginTop: '8px',
    }}>
      {modes.map((m) => {
        const colors = MODE_COLORS[m.id] ?? MODE_COLORS.refugio;
        const isActive = m.id === activeMode;
        return (
          <button
            key={m.id}
            title={m.description}
            onClick={() => onSelect(m.id)}
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${colors.bg}, ${colors.accent}55)`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? colors.accent : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '6px 2px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.15s ease',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
              color: isActive ? colors.text : 'rgba(255,255,255,0.55)',
            }}
          >
            <span style={{ fontSize: '16px' }}>{m.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 400 }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function WorldCard({ world, onDestroy }) {
  const colors = MODE_COLORS[world.scale] ?? MODE_COLORS.mundo;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.bg}dd, ${colors.accent}11)`,
      border: `1px solid ${colors.accent}33`,
      borderRadius: '10px',
      padding: '10px 12px',
      marginBottom: '6px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: colors.accent }}>
            {world.name}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            {world.type} · {world.scale} · tick {world.tick}
          </div>
        </div>
        <button
          onClick={() => onDestroy(world.id)}
          title="Destroy this world"
          style={{
            background: 'rgba(255,60,60,0.15)',
            border: '1px solid rgba(255,60,60,0.4)',
            color: '#ff6b6b',
            borderRadius: '6px',
            padding: '3px 8px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          ✕ Destruir
        </button>
      </div>
      <div style={{
        display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap'
      }}>
        {[
          { label: '⚡', val: Math.round(world.resources?.energy ?? 0) },
          { label: '🪨', val: Math.round(world.resources?.matter ?? 0) },
          { label: '🧠', val: Math.round(world.resources?.information ?? 0) },
        ].map((r) => (
          <span key={r.label} style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.65)',
          }}>
            {r.label} {r.val}
          </span>
        ))}
        {world.biomes?.slice(0, 3).map((b) => (
          <span key={b} style={{
            background: `${colors.accent}22`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            color: colors.accent,
          }}>
            {b}
          </span>
        ))}
      </div>
      {world.recentHistory?.[0] && (
        <div style={{
          marginTop: '6px', fontSize: '10px',
          color: 'rgba(255,255,255,0.35)', fontStyle: 'italic',
        }}>
          {world.recentHistory[0]}
        </div>
      )}
    </div>
  );
}

export function HeroRefugePanel() {
  const [hero, setHero] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [agentAnswer, setAgentAnswer] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ open: false, name: '', type: 'standard', biomes: ['forest'], scale: '' });
  const [createHeroForm, setCreateHeroForm] = useState({ open: false, name: '', title: '' });
  const [view, setView] = useState('agent'); // 'agent' | 'worlds'
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
    try {
      await api.switchHeroMode(modeId);
      await fetchHero();
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const resp = await api.queryHeroAgent(query.trim(), { worldCount: worlds.length });
      setAgentAnswer(resp.answer ?? '');
      setQuery('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorld = async () => {
    setLoading(true);
    try {
      await api.createHeroWorld({
        name: createForm.name || `World-${Date.now()}`,
        type: createForm.type,
        biomes: createForm.biomes,
        scale: createForm.scale || hero?.activeMode,
      });
      setCreateForm((p) => ({ ...p, open: false, name: '' }));
      await fetchHero();
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyWorld = async (worldId) => {
    setLoading(true);
    try {
      await api.destroyHeroWorld(worldId);
      await fetchHero();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHero = async () => {
    setLoading(true);
    try {
      await api.createHero(
        createHeroForm.name || 'The Hero',
        createHeroForm.title || 'Architect of Worlds'
      );
      setCreateHeroForm({ open: false, name: '', title: '' });
      await fetchHero();
    } finally {
      setLoading(false);
    }
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
          <div style={{
            fontSize: '13px', fontWeight: 700,
            color: colors.accent, letterSpacing: '0.05em',
          }}>
            🛡️ Hero Refuge
          </div>
          {hero && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
              {hero.name} · {hero.title}
            </div>
          )}
        </div>
        <button
          onClick={() => setCreateHeroForm((p) => ({ ...p, open: !p.open }))}
          style={{
            background: `${colors.accent}22`,
            border: `1px solid ${colors.accent}44`,
            color: colors.accent,
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          {createHeroForm.open ? '✕' : '+ Héroe'}
        </button>
      </div>

      {/* Create hero form */}
      {createHeroForm.open && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '10px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <input
            placeholder="Nombre del héroe"
            value={createHeroForm.name}
            onChange={(e) => setCreateHeroForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Título (ej. Arquitecto de Mundos)"
            value={createHeroForm.title}
            onChange={(e) => setCreateHeroForm((p) => ({ ...p, title: e.target.value }))}
            style={inputStyle}
          />
          <button onClick={handleCreateHero} disabled={loading} style={btnStyle(colors.accent)}>
            Crear Héroe
          </button>
        </div>
      )}

      {hero && (
        <>
          {/* Mode grid */}
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
            MODO ACTIVO · <span style={{ color: colors.accent }}>
              {hero.modes?.find((m) => m.id === hero.activeMode)?.icon}{' '}
              {hero.activeMode?.toUpperCase()}
            </span>
          </div>
          <ModeGrid
            modes={hero.modes ?? []}
            activeMode={hero.activeMode}
            onSelect={handleSwitchMode}
          />

          {/* Tab switcher */}
          <div style={{
            display: 'flex', gap: '4px', marginTop: '12px', marginBottom: '6px',
          }}>
            {[['agent', '🤖 Agente'], ['worlds', '🌍 Mundos']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  flex: 1,
                  background: view === v ? `${colors.accent}33` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${view === v ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                  color: view === v ? colors.accent : 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  padding: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* AGENT VIEW */}
          {view === 'agent' && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '8px',
                fontSize: '11px',
              }}>
                <div style={{ color: colors.accent, fontWeight: 700, marginBottom: '4px' }}>
                  {hero.agent?.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>
                  Interacciones: {hero.agent?.interactions ?? 0} ·
                  Memoria: {hero.agent?.memoryCount ?? 0} entradas
                </div>
                {hero.agent?.recentMemory?.slice(0, 2).map((m, i) => (
                  <div key={i} style={{
                    marginTop: '3px', fontSize: '9px',
                    color: 'rgba(255,255,255,0.3)', fontStyle: 'italic',
                  }}>
                    › {m.event}
                  </div>
                ))}
              </div>

              <AgentBubble message={agentAnswer} mode={hero.activeMode} />

              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <input
                  placeholder="Pregunta al agente..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  style={btnStyle(colors.accent)}
                >
                  ➤
                </button>
              </div>

              {/* Traits */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>
                  RASGOS DEL AGENTE
                </div>
                {Object.entries(hero.agent?.traits ?? {}).map(([trait, val]) => (
                  <div key={trait} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', width: '90px' }}>
                      {trait}
                    </span>
                    <div style={{
                      flex: 1, height: '4px',
                      background: 'rgba(255,255,255,0.08)', borderRadius: '2px',
                    }}>
                      <div style={{
                        width: `${(val * 100).toFixed(0)}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}88)`,
                        borderRadius: '2px',
                      }} />
                    </div>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', width: '28px', textAlign: 'right' }}>
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORLDS VIEW */}
          {view === 'worlds' && (
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '8px',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  {worlds.length} mundos vivos · {hero.stats?.worldsCreated ?? 0} creados · {hero.stats?.worldsDestroyed ?? 0} destruidos
                </div>
                <button
                  onClick={() => setCreateForm((p) => ({ ...p, open: !p.open }))}
                  style={btnStyle(colors.accent)}
                >
                  {createForm.open ? '✕' : '+ Mundo'}
                </button>
              </div>

              {createForm.open && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px', padding: '10px',
                  marginBottom: '10px', display: 'flex',
                  flexDirection: 'column', gap: '6px',
                }}>
                  <input
                    placeholder="Nombre del mundo"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
                    style={inputStyle}
                  >
                    {WORLD_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Biomas:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {BIOME_OPTIONS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setCreateForm((p) => ({
                          ...p,
                          biomes: p.biomes.includes(b)
                            ? p.biomes.filter((x) => x !== b)
                            : [...p.biomes, b],
                        }))}
                        style={{
                          background: createForm.biomes.includes(b)
                            ? `${colors.accent}33` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${createForm.biomes.includes(b) ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                          color: createForm.biomes.includes(b) ? colors.accent : 'rgba(255,255,255,0.4)',
                          borderRadius: '4px', padding: '3px 7px',
                          cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleCreateWorld} disabled={loading} style={btnStyle(colors.accent)}>
                    Crear Mundo
                  </button>
                </div>
              )}

              {worlds.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '20px 0',
                  color: 'rgba(255,255,255,0.2)', fontSize: '11px',
                }}>
                  No hay mundos vivos.<br />Crea el primero.
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {worlds.map((w) => (
                    <WorldCard key={w.id} world={w} onDestroy={handleDestroyWorld} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats footer */}
          <div style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '8px', justifyContent: 'space-between',
            fontSize: '9px', color: 'rgba(255,255,255,0.25)',
          }}>
            <span>⏱ Ticks: {hero.stats?.totalTicks ?? 0}</span>
            <span>🌍 Creados: {hero.stats?.worldsCreated ?? 0}</span>
            <span>💥 Destruidos: {hero.stats?.worldsDestroyed ?? 0}</span>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  padding: '6px 8px',
  color: '#fff',
  fontSize: '11px',
  fontFamily: 'monospace',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function btnStyle(accent) {
  return {
    background: `${accent}22`,
    border: `1px solid ${accent}55`,
    color: accent,
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  };
}
