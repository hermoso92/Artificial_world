/**
 * Life Form Detail Panel - agent traits, stats, lineage.
 */
export function AgentDetailPanel({ selectedAgent, agents, onSelectAgent }) {
  if (!agents?.length) return null;

  const formatTrait = (v) => (v == null ? '—' : v.toFixed(2));

  return (
    <div className="panel agent-detail-panel">
      <h3>Life Form Detail</h3>
      {selectedAgent ? (
        <div className="selected-agent-info">
          <div className="agent-name-row">
            <span className="agent-name">Agent #{selectedAgent.id}</span>
            <span className="energy-badge">
              {((selectedAgent.energy ?? 0) * 100).toFixed(0)}% E
            </span>
          </div>
          <div className="agent-action">
            <span className="label">Matter:</span>
            <span className="value">{((selectedAgent.matter ?? 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="agent-action">
            <span className="label">State:</span>
            <span className="value">{selectedAgent.state || 'idle'}</span>
          </div>
          {selectedAgent.traits && (
            <div className="agent-traits">
              <span className="label">Traits</span>
              <div className="traits-badges">
                <span className="trait-badge">Speed: {formatTrait(selectedAgent.traits.movementSpeed)}</span>
                <span className="trait-badge">Metabolism: {formatTrait(selectedAgent.traits.metabolism)}</span>
                <span className="trait-badge">Attack: {formatTrait(selectedAgent.traits.attack)}</span>
                <span className="trait-badge">Defense: {formatTrait(selectedAgent.traits.defense)}</span>
                <span className="trait-badge">Gathering: {formatTrait(selectedAgent.traits.gatheringRate)}</span>
              </div>
            </div>
          )}
          <div className="agent-action">
            <span className="label">Position:</span>
            <span className="value">{selectedAgent.gridX}, {selectedAgent.gridY}</span>
          </div>
          <div className="agent-action">
            <span className="label">Lineage:</span>
            <span className="value">#{selectedAgent.lineageId ?? selectedAgent.id}</span>
          </div>
        </div>
      ) : (
        <p className="hint">Click an agent on the grid to select</p>
      )}
      <div className="agent-list">
        <h4>Agents ({agents.length})</h4>
        {(agents ?? []).slice(0, 12).map((a) => (
          <button
            key={a.id}
            type="button"
            className={`agent-list-item ${selectedAgent?.id === a.id ? 'selected' : ''}`}
            onClick={() => onSelectAgent(a)}
          >
            <span className="name">#{a.id}</span>
            <span className="energy">{((a.energy ?? 0) * 100).toFixed(0)}%</span>
          </button>
        ))}
        {(agents?.length ?? 0) > 12 ? (
          <span className="hint">+{(agents?.length ?? 0) - 12} more</span>
        ) : null}
      </div>
    </div>
  );
}
