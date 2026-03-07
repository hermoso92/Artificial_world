/**
 * Refuge Management Panel - owned refuges, upgrades, release.
 */
export function RefugeManagementPanel({ world, onRelease }) {
  const refuge = world?.refuge ?? null;

  return (
    <div className="panel refuge-management-panel">
      <h3>Refuge Management</h3>
      {refuge ? (
        <>
          <div className="stat-row">
            <span className="stat-label">Refuge ID:</span>
            <span className="stat-value">#{refuge.id}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Plot:</span>
            <span className="stat-value">{refuge.plotIndex + 1}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Population:</span>
            <span className="stat-value">{refuge.agentCount ?? 0} / {refuge.maxAgents ?? 50}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Solar Nodes:</span>
            <span className="stat-value">{refuge.solarNodes?.length ?? 0}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Mineral Nodes:</span>
            <span className="stat-value">{refuge.mineralNodes?.length ?? 0}</span>
          </div>
          <p className="panel-hint">Use Genetic Assembler to create blueprints and release agents.</p>
        </>
      ) : (
        <p className="panel-hint">No refuge selected.</p>
      )}
    </div>
  );
}
