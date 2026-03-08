/**
 * Worlds tab content for HeroRefugePanel.
 */
import { WorldCard } from './WorldCard';
import { WORLD_TYPE_OPTIONS, BIOME_OPTIONS, inputStyle, btnStyle } from './constants';

export function HeroRefugeWorldsView({
  hero,
  worlds,
  createForm,
  setCreateForm,
  civilizationSeeds,
  handleCreateWorld,
  handleDestroyWorld,
  setEnteredWorldId,
  loading,
  colors,
}) {
  return (
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
          <input placeholder="Nombre del refugio fundador" value={createForm.refugeName} onChange={(e) => setCreateForm((p) => ({ ...p, refugeName: e.target.value }))} style={inputStyle} />
          <select value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))} style={inputStyle}>
            {WORLD_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={createForm.civilizationSeedId} onChange={(e) => setCreateForm((p) => ({ ...p, civilizationSeedId: e.target.value }))} style={inputStyle}>
            {civilizationSeeds.map((seed) => (
              <option key={seed.value} value={seed.value}>
                {seed.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
            {civilizationSeeds.find((seed) => seed.value === createForm.civilizationSeedId)?.tone ?? 'Elige la tension fundadora de tu civilizacion.'}
          </div>
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
  );
}
