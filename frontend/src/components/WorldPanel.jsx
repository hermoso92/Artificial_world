export function WorldPanel({ world }) {
  const refuge = world?.refuge;
  const agentCount = refuge?.agentCount ?? 0;
  const agents = refuge?.agents ?? [];
  const avgEnergy = agents.length > 0
    ? agents.reduce((s, a) => s + (a.energy ?? 0), 0) / agents.length
    : 0;

  return (
    <div className="panel world-panel">
      <h3>World</h3>
      <div className="stat-row">
        <span className="stat-label">Avg Energy:</span>
        <span className="stat-value accent">{avgEnergy.toFixed(2)}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Agents:</span>
        <span className="stat-value">{agentCount}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Solar Nodes:</span>
        <span className="stat-value">{refuge?.solarNodes?.length ?? 0}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Mineral Nodes:</span>
        <span className="stat-value">{refuge?.mineralNodes?.length ?? 0}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Grid:</span>
        <span className="stat-value">{refuge?.gridSize ?? 32}×{refuge?.gridSize ?? 32}</span>
      </div>
    </div>
  );
}
