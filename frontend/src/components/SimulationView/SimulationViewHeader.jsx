/**
 * Header for SimulationView.
 */
export function SimulationViewHeader({ hero, connected, onBack, onNavigate }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="back-btn" onClick={onBack}>← Hub</button>
      </div>
      <div className="header-center">
        <h1>{hero?.name ? `${hero.name} — Tu Mundo` : 'Tu Mundo'}</h1>
        <p className="subtitle">
          {hero?.companion?.name
            ? `${hero.companion.name} te acompaña · ${hero?.modes?.find((m) => m.id === hero.activeMode)?.label ?? 'Refugio'}`
            : 'Constrúyelo. Habítalo. Haz que crezca.'}
        </p>
      </div>
      <div className="header-right">
        {onNavigate && (
          <button type="button" className="header-link" onClick={() => onNavigate('missioncontrol')}>
            Observatorio
          </button>
        )}
        <span className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
          {connected ? '● Live' : '○ Offline'}
        </span>
      </div>
    </header>
  );
}
