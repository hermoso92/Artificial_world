/**
 * Stat bar for refuge player stats.
 */
export function StatBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="stat-bar-item">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-bar-value">{Math.round(pct)}</span>
    </div>
  );
}
