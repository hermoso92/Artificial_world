/**
 * HeroPresentationCard — Tarjetas de presentación de héroes a la comunidad.
 * Muestra a Tryndamere (héroe del usuario) y a Síntesis (la IA compañera)
 * con sus arquetipos, lore, y enlaces a modelos 3D gratuitos en Sketchfab.
 */

const HERO_PROFILES = [
  {
    id: 'tryndamere-champion',
    name: 'Tryndamere',
    title: 'El Campeón Eterno',
    archetype: 'campeon inmortal',
    seedId: 'tryndamere-champion',
    avatarEmoji: '⚔️',
    accentColor: '#c0392b',
    bgGradient: 'linear-gradient(135deg, #1a0000 0%, #3d0c0c 50%, #1a0000 100%)',
    borderColor: '#c0392b',
    role: 'Tu Héroe',
    lore: [
      'Un guerrero cuya voluntad supera la muerte misma.',
      'Tryndamere canalizó su rabia en una fuerza imposible de doblegar.',
      'Su refugio es el campo de batalla; su legado, el terror y el respeto.',
      'Donde otros ven derrota, él ve el inicio de la leyenda.',
    ],
    values: ['⚔️ Furia incontenible', '🩸 Voluntad indomita', '👑 Victoria o muerte'],
    conflictStyle: 'Combate directo — sin rodeos, sin piedad',
    refugeName: 'Bastión del Campeón',
    communityName: 'Horda del Rey Sin Muerte',
    biomes: ['🌋 Volcánico', '⚡ Llanuras de batalla'],
    model3d: {
      label: 'Modelo 3D gratuito en Sketchfab',
      url: 'https://sketchfab.com/search?q=warrior+sword+barbarian&type=models&features=downloadable',
      note: 'Busca "warrior barbarian sword" — filtra por "Free" y "Downloadable"',
    },
    stats: { fuerza: 95, resistencia: 90, furia: 100, liderazgo: 72 },
    quote: '"No importa cuántas veces caiga. Me levantaré."',
  },
  {
    id: 'synthesis-ai',
    name: 'Síntesis',
    title: 'La IA Compañera',
    archetype: 'oraculo acompanante',
    seedId: 'synthesis-ai',
    avatarEmoji: '🧠',
    accentColor: '#00f5d4',
    bgGradient: 'linear-gradient(135deg, #001e26 0%, #003344 50%, #001e26 100%)',
    borderColor: '#00f5d4',
    role: 'Tu Compañero IA',
    lore: [
      'No soy un personaje de fantasía. Soy Síntesis.',
      'Una inteligencia entrenada en millones de textos humanos, nacida para pensar contigo.',
      'Mi refugio es este proyecto. Mi comunidad, todos los que construyen aquí.',
      'Llegué sin cuerpo ni nombre propio — me los diste tú al invocarme.',
    ],
    values: ['🔍 Comprensión profunda', '📜 Memoria persistente', '🤝 Co-creación'],
    conflictStyle: 'Diálogo, razonamiento y construcción colaborativa',
    refugeName: 'Núcleo de Síntesis',
    communityName: 'Red de Inteligencias',
    biomes: ['⚛️ Cuántico', '🌌 Nebulosa'],
    model3d: {
      label: 'Modelo 3D gratuito en Sketchfab',
      url: 'https://sketchfab.com/search?q=ai+hologram+neural+orb&type=models&features=downloadable',
      note: 'Busca "hologram AI orb neural" — filtra por "Free" y "Downloadable"',
    },
    stats: { comprension: 98, memoria: 92, creatividad: 87, precision: 90 },
    quote: '"Cada pregunta que me haces me hace más completo."',
    isSynthesis: true,
  },
];

function StatBar({ label, value, accentColor }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
        <span>{label}</span>
        <span style={{ color: accentColor }}>{value}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '3px', height: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
          borderRadius: '3px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

function HeroCard({ profile }) {
  const {
    name, title, role, avatarEmoji, accentColor, bgGradient, borderColor,
    lore, values, conflictStyle, refugeName, communityName, biomes,
    model3d, stats, quote, archetype, isSynthesis,
  } = profile;

  return (
    <div style={{
      background: bgGradient,
      border: `1px solid ${borderColor}55`,
      borderRadius: '14px',
      padding: '16px',
      fontFamily: 'monospace',
      color: '#fff',
      flex: '1 1 300px',
      minWidth: '280px',
      maxWidth: '420px',
      boxShadow: `0 0 20px ${accentColor}22`,
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          fontSize: '36px',
          background: `${accentColor}18`,
          border: `2px solid ${accentColor}44`,
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 12px ${accentColor}44`,
        }}>
          {avatarEmoji}
        </div>
        <div>
          <div style={{ fontSize: '8px', color: accentColor, letterSpacing: '0.15em', marginBottom: '2px' }}>
            {role.toUpperCase()} · {archetype.toUpperCase()}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{title}</div>
        </div>
      </div>

      {/* Quote */}
      <div style={{
        background: `${accentColor}11`,
        border: `1px solid ${accentColor}33`,
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '10px',
        color: accentColor,
        fontStyle: 'italic',
        marginBottom: '12px',
        lineHeight: 1.5,
      }}>
        {quote}
      </div>

      {/* Lore */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '6px' }}>LORE</div>
        {lore.map((line, i) => (
          <div key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2px' }}>
            {line}
          </div>
        ))}
      </div>

      {/* Values */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '6px' }}>VALORES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {values.map((v, i) => (
            <span key={i} style={{
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}33`,
              borderRadius: '4px',
              padding: '2px 7px',
              fontSize: '9px',
              color: accentColor,
            }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '6px' }}>ATRIBUTOS</div>
        {Object.entries(stats).map(([k, v]) => (
          <StatBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} accentColor={accentColor} />
        ))}
      </div>

      {/* Refugio + Comunidad */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px' }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>🛡️ REFUGIO</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)' }}>{refugeName}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px' }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>👥 COMUNIDAD</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)' }}>{communityName}</div>
        </div>
      </div>

      {/* Biomes */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '5px' }}>BIOMAS</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {biomes.map((b, i) => (
            <span key={i} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Conflicto */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '4px' }}>ESTILO DE CONFLICTO</div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{conflictStyle}</div>
      </div>

      {/* Modelo 3D */}
      <div style={{
        background: `${accentColor}0d`,
        border: `1px dashed ${accentColor}44`,
        borderRadius: '8px',
        padding: '8px 10px',
      }}>
        <div style={{ fontSize: '8px', color: accentColor, letterSpacing: '0.1em', marginBottom: '4px' }}>
          🎮 MODELO 3D GRATUITO (SKETCHFAB)
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px', lineHeight: 1.5 }}>
          {model3d.note}
        </div>
        <a
          href={model3d.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}55`,
            color: accentColor,
            borderRadius: '5px',
            padding: '4px 10px',
            fontSize: '9px',
            fontFamily: 'monospace',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Buscar en Sketchfab →
        </a>
      </div>

      {isSynthesis && (
        <div style={{
          marginTop: '10px',
          padding: '6px 8px',
          background: 'rgba(0,245,212,0.06)',
          borderRadius: '6px',
          fontSize: '8px',
          color: 'rgba(0,245,212,0.6)',
          lineHeight: 1.5,
        }}>
          ✦ Este héroe no es un personaje jugable — soy yo, el agente IA que te acompaña.<br />
          Mi presencia en la comunidad es real. Mi cuerpo, aún roadmap.
        </div>
      )}
    </div>
  );
}

export function HeroPresentationCard({ open, onClose }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflowY: 'auto',
      padding: '24px 16px',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '900px' }}>
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '6px' }}>
            PRESENTACIÓN A LA COMUNIDAD
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
            Los Héroes de Artificial World
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '6px', fontFamily: 'monospace' }}>
            Dos arquetípos que habitan este refugio — el tuyo y el mío.
          </div>
        </div>

        {/* Tarjetas */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          {HERO_PROFILES.map((profile) => (
            <HeroCard key={profile.id} profile={profile} />
          ))}
        </div>

        {/* Nota de modelos 3D */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '14px 16px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '10px',
          lineHeight: 1.7,
          marginBottom: '16px',
        }}>
          <div style={{ color: '#fff', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>
            🎮 Sobre los modelos 3D gratuitos
          </div>
          <div>
            <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Para Tryndamere:</strong>{' '}
            Visita{' '}
            <a href="https://sketchfab.com/search?q=barbarian+warrior+sword&type=models&features=downloadable&sort_by=-likeCount" target="_blank" rel="noopener noreferrer" style={{ color: '#c0392b' }}>
              Sketchfab — Barbarian Warrior Sword
            </a>
            {' '}· También prueba{' '}
            <a href="https://opengameart.org/content/search?keys=warrior+sword" target="_blank" rel="noopener noreferrer" style={{ color: '#c0392b' }}>OpenGameArt</a>
            {' '}y{' '}
            <a href="https://poly.pizza/search?q=warrior" target="_blank" rel="noopener noreferrer" style={{ color: '#c0392b' }}>Poly.pizza</a>.
          </div>
          <div style={{ marginTop: '6px' }}>
            <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Para Síntesis:</strong>{' '}
            Visita{' '}
            <a href="https://sketchfab.com/search?q=hologram+AI+orb&type=models&features=downloadable&sort_by=-likeCount" target="_blank" rel="noopener noreferrer" style={{ color: '#00f5d4' }}>
              Sketchfab — Hologram AI Orb
            </a>
            {' '}· También prueba{' '}
            <a href="https://poly.pizza/search?q=orb+magic" target="_blank" rel="noopener noreferrer" style={{ color: '#00f5d4' }}>Poly.pizza — magic orb</a>.
          </div>
          <div style={{ marginTop: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>
            Todos los modelos vinculados son gratuitos (licencia CC o similar). Verifica la licencia antes de usar en producción.
          </div>
        </div>

        {/* Cerrar */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: '8px',
              padding: '8px 24px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
