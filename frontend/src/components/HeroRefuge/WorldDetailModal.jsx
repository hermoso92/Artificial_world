import { MODE_COLORS, BIOME_OPTIONS } from './constants';

const BIOME_LABELS = Object.fromEntries(BIOME_OPTIONS.map((b) => [b.value, b.label]));

export function WorldDetailModal({ world, onClose }) {
  if (!world) return null;
  const colors = MODE_COLORS[world.scale] ?? MODE_COLORS.mundo;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="world-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${colors.bg} 0%, #0a0a0f 100%)`,
          border: `2px solid ${colors.accent}`,
          borderRadius: '14px',
          padding: '20px',
          maxWidth: '420px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          color: '#fff',
          fontFamily: 'monospace',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <h2 id="world-detail-title" style={{ margin: 0, fontSize: '18px', color: colors.accent }}>
            {world.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ✕ Cerrar
          </button>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
          {world.type} · edad {world.tick}
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>RIQUEZA DEL MUNDO</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>⚡ Energía {Math.round(world.resources?.energy ?? 0)}</span>
            <span>🪨 Materia {Math.round(world.resources?.matter ?? 0)}</span>
            <span>🧠 Saber {Math.round(world.resources?.information ?? 0)}</span>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>PAISAJES</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(world.biomes ?? []).map((b) => (
              <span key={b} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
              }}>
                {BIOME_LABELS[b] ?? b}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>CRÓNICA</div>
          <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {(world.recentHistory ?? []).length > 0
              ? world.recentHistory.map((h, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>› {h}</div>
                ))
              : 'Este mundo acaba de nacer. Su historia está por escribirse.'}
          </div>
        </div>
      </div>
    </div>
  );
}
