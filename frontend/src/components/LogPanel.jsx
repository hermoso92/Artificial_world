export function LogPanel({ logs }) {
  return (
    <div className="panel log-panel">
      <h3>Events</h3>
      <div className="log-list">
        {(!logs || logs.length === 0) && (
          <div className="log-item empty">No events yet</div>
        )}
        {(logs || []).map((log, i) => (
          <div key={i} className={`log-item ${log.type || 'info'}`}>
            <span className="log-tick">[{log.tick}]</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
