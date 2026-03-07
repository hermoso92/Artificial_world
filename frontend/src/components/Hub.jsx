/**
 * Hub — main entry screen connecting the 3 pillars of Artificial World.
 */

const PILLARS = [
  {
    id: 'simulation',
    icon: '🧬',
    title: 'Simulación',
    subtitle: 'Artificial Worlds',
    description: 'Diseña especies, libera agentes y observa cómo evolucionan en entornos hostiles. Motor utility-based con memoria y relaciones sociales.',
    features: ['Agentes autónomos', 'Genética de especies', 'Hero Refuge · 13 modos', 'Auditoría hash chain'],
    color: '#00d4ff',
    bg: '#001a20',
    available: true,
  },
  {
    id: 'minigames',
    icon: '🎮',
    title: 'Minijuegos',
    subtitle: 'Social Games',
    description: 'Juegos clásicos contra otros jugadores o contra IAs que usan el mismo motor de decisión de la simulación.',
    features: ['3 en raya · PvP y PvAI', 'Damas (próximamente)', 'Ajedrez (próximamente)', 'IA utility-based'],
    color: '#7c3aed',
    bg: '#0d0520',
    available: true,
  },
  {
    id: 'dobacksoft',
    icon: '🚒',
    title: 'DobackSoft',
    subtitle: 'Fire Simulator',
    description: 'Conduce un camión de bomberos por paisajes 2D realistas hasta la emergencia. Niveles, tráfico, semáforos y condiciones climáticas.',
    features: ['Simulador 2D', 'Vehículo controlable', 'Múltiples escenarios', 'Objetos y obstáculos'],
    color: '#f97316',
    bg: '#1c0800',
    available: true,
    badge: '9,99€ cupón',
  },
  {
    id: 'missioncontrol',
    icon: '📡',
    title: 'Mission Control',
    subtitle: 'Dashboard',
    description: 'Panel de control en tiempo real: agentes, actividad, métricas del sistema y auditoría. Inspirado en TenacitOS.',
    features: ['KPIs en vivo', 'Tabla de agentes', 'Feed de actividad', 'Gráficas y auditoría'],
    color: '#00e676',
    bg: '#001a0d',
    available: true,
  },
];

export function Hub({ onNavigate }) {
  return (
    <div className="hub">
      <div className="hub-hero">
        <h1 className="hub-title">
          <span className="hub-title-accent">Artificial</span> World
        </h1>
        <p className="hub-subtitle">Un ecosistema de experiencias conectadas</p>
      </div>

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
        <span>Artificial World · Simulación · Juegos · Simuladores</span>
      </footer>
    </div>
  );
}
