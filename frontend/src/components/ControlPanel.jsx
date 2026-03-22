export function ControlPanel({ world, onStart, onPause, onReset, loading }) {
  const status = world?.running ? 'running' : 'paused';
  const agentCount = world?.refuge?.agentCount ?? world?.refuge?.agents?.length ?? 0;

  return (
    <div className="panel control-panel">
      <h3>Control</h3>
      <div className="stat-row">
        <span className="stat-label">Status:</span>
        <span className={`stat-value ${status}`}>{status === 'running' ? 'Running' : 'Paused'}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Tick:</span>
        <span className="stat-value">{world?.tick ?? 0}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Agents:</span>
        <span className="stat-value">{agentCount}</span>
      </div>
      <div className="panel-actions">
        <button
          className="btn btn-primary"
          onClick={onStart}
          disabled={loading || status === 'running'}
        >
          Start
        </button>
        <button
          className="btn btn-secondary"
          onClick={onPause}
          disabled={loading || status === 'paused'}
        >
          Pause
        </button>
        <button className="btn btn-secondary" onClick={onReset} disabled={loading}>
          Reset
        </button>
      </div>
    </div>
  );
}
