import { MODE_COLORS, BIOME_OPTIONS } from './constants';

const BIOME_LABELS = Object.fromEntries(BIOME_OPTIONS.map((b) => [b.value, b.label]));

export function WorldCard({ world, onDestroy, onEnter }) {
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
            {world.type} · edad {world.tick}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onEnter && (
            <button
              onClick={() => onEnter(world)}
              title="Habitar este mundo"
              style={{
                background: `${colors.accent}33`,
                border: `1px solid ${colors.accent}66`,
                color: colors.accent,
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Habitar →
            </button>
          )}
          <button
            onClick={() => onDestroy(world.id)}
            title="Dejar ir este mundo"
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
            ✕
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {world.civilizationSeed?.label && (
          <span style={{
            background: `${colors.accent}22`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            color: colors.accent,
          }}>
            Semilla: {world.civilizationSeed.label}
          </span>
        )}
        {[
          { label: '⚡ Energía', val: Math.round(world.resources?.energy ?? 0) },
          { label: '🪨 Materia', val: Math.round(world.resources?.matter ?? 0) },
          { label: '🧠 Saber', val: Math.round(world.resources?.information ?? 0) },
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
            {BIOME_LABELS[b] ?? b}
          </span>
        ))}
      </div>
      {world.simulationRefugeIndex != null && (
        <div style={{
          marginTop: '6px', fontSize: '9px',
          color: colors.accent, opacity: 0.6,
        }}>
          🔗 Refugio #{world.simulationRefugeIndex + 1} en la simulacion · {world.foundingRefuge?.name ?? world.name}
        </div>
      )}
      {world.recentHistory?.[0] && (
        <div style={{
          marginTop: '4px', fontSize: '10px',
          color: 'rgba(255,255,255,0.35)', fontStyle: 'italic',
        }}>
          {world.recentHistory[0]}
        </div>
      )}
    </div>
  );
}
