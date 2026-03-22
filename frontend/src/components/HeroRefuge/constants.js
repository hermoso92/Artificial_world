/**
 * Constructor de Mundos — constants.
 */
export const MODE_COLORS = {
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

export const WORLD_TYPE_OPTIONS = [
  { value: 'standard',    label: 'Clásico' },
  { value: 'void',        label: 'Vacío' },
  { value: 'crystalline', label: 'Cristalino' },
  { value: 'organic',     label: 'Orgánico' },
  { value: 'digital',     label: 'Digital' },
  { value: 'temporal',    label: 'Temporal' },
];

export const BIOME_OPTIONS = [
  { value: 'forest',   label: 'Bosque' },
  { value: 'plains',   label: 'Llanuras' },
  { value: 'ocean',    label: 'Océano' },
  { value: 'desert',   label: 'Desierto' },
  { value: 'tundra',   label: 'Tundra' },
  { value: 'volcanic', label: 'Volcánico' },
  { value: 'nebula',   label: 'Nebulosa' },
  { value: 'quantum',  label: 'Cuántico' },
];

export const CIVILIZATION_SEED_OPTIONS = [
  { value: 'frontier-tribe', label: 'Tribu de frontera', tone: 'Supervivencia, cooperacion y frontera viva', defaultRefugeName: 'Refugio de frontera' },
  { value: 'technocrat-refuge', label: 'Refugio tecnocrata', tone: 'Orden, energia y planificacion', defaultRefugeName: 'Nodo central' },
  { value: 'spiritual-community', label: 'Comunidad espiritual', tone: 'Memoria, ritual y cohesion', defaultRefugeName: 'Santuario inicial' },
  { value: 'warrior-kingdom', label: 'Reino guerrero', tone: 'Jerarquia, expansion y conflicto', defaultRefugeName: 'Bastion fundador' },
  { value: 'merchant-city', label: 'Ciudad comerciante', tone: 'Rutas, intercambio y acuerdos', defaultRefugeName: 'Puerto de origen' },
  { value: 'paranoid-colony', label: 'Colonia paranoica', tone: 'Seguridad, vigilancia y sospecha', defaultRefugeName: 'Sector sellado' },
  { value: 'decadent-empire', label: 'Imperio decadente', tone: 'Linaje, intriga y declive', defaultRefugeName: 'Palacio gastado' },
  { value: 'tryndamere-champion', label: '⚔️ El Campeón Eterno', tone: 'Furia, voluntad indomita y victoria', defaultRefugeName: 'Bastión del Campeón' },
  { value: 'synthesis-ai', label: '🧠 Síntesis — IA Compañera', tone: 'Comprensión, memoria y co-creación', defaultRefugeName: 'Núcleo de Síntesis' },
];

export const inputStyle = {
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

export function btnStyle(accent) {
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
