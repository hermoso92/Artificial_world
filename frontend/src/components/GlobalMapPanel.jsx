/**
 * Global Map Panel - AW-256 world overview and refuge selection.
 */
export function GlobalMapPanel({ world, activeRefugeIndex, onSelectRefuge }) {
  const refuge = world?.refuge ?? null;
  const refugeCount = world?.refugeCount ?? 16;

  return (
    <div className="panel global-map-panel">
      <h3>Global Map</h3>
      <div className="stat-row">
        <span className="stat-label">World Class:</span>
        <span className="stat-value accent">{world?.worldClass ?? 'AW-256'}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Refuge Plots:</span>
        <span className="stat-value">{refugeCount}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Active Refuge:</span>
        <span className="stat-value">#{activeRefugeIndex + 1}</span>
      </div>
      {refuge && (
        <>
          <div className="stat-row">
            <span className="stat-label">Agents:</span>
            <span className="stat-value">{refuge.agentCount ?? 0} / {refuge.maxAgents ?? 50}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Grid:</span>
            <span className="stat-value">{refuge.gridSize ?? 32}×{refuge.gridSize ?? 32}</span>
          </div>
        </>
      )}
      <div className="refuge-grid-preview">
        <div className="refuge-grid-label">Refuge Plots ({refugeCount} total)</div>
        <div className="refuge-grid">
          {Array.from({ length: Math.min(64, refugeCount) }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`refuge-plot ${i === activeRefugeIndex ? 'active' : ''}`}
              onClick={() => onSelectRefuge?.(i)}
              title={`Refuge ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
