import { MODE_COLORS } from './constants';

export function AgentBubble({ message, mode }) {
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
        Compañero:
      </span>{' '}
      {message}
    </div>
  );
}
