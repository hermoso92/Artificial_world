/**
 * Header and create-hero form for HeroRefugePanel.
 */
import { btnStyle, inputStyle } from './constants';

export function HeroRefugeHeader({ hero, createHeroForm, setCreateHeroForm, handleCreateHero, loading, colors }) {
  return (
    <>
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

      {createHeroForm.open && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input placeholder="Tu nombre" value={createHeroForm.name} onChange={(e) => setCreateHeroForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
          <input placeholder="Tu título (ej. Constructor de Mundos)" value={createHeroForm.title} onChange={(e) => setCreateHeroForm((p) => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <button onClick={handleCreateHero} disabled={loading} style={btnStyle(colors.accent)}>Empezar a construir</button>
        </div>
      )}
    </>
  );
}
