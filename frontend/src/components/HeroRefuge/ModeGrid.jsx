import { MODE_COLORS } from './constants';

export function ModeGrid({ modes, activeMode, onSelect }) {
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
