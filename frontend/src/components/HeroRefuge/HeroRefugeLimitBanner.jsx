/**
 * Limit message banner with upgrade CTA.
 */
import { btnStyle } from './constants';

export function HeroRefugeLimitBanner({ limitMsg, onUpgrade }) {
  if (!limitMsg) return null;
  return (
    <div style={{
      marginTop: '10px',
      background: 'rgba(255,82,82,0.1)',
      border: '1px solid rgba(255,82,82,0.3)',
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '11px',
      color: '#ff8a80',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span>{limitMsg}</span>
      <button onClick={onUpgrade} style={{ ...btnStyle('#00d4ff'), whiteSpace: 'nowrap' }}>
        Mejorar plan
      </button>
    </div>
  );
}
