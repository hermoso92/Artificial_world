/**
 * Refuge Management Panel - owned refuges, upgrades, release.
 * Permite crear "Mi casa" (refugio 32×32) si el jugador no tiene uno.
 */
import { useState } from 'react';

export function RefugeManagementPanel({ world, onRelease, refuges = [], playerId, onCreateRefuge, loading }) {
  const refuge = world?.refuge ?? null;
  const hasMyRefuge = refuges.some((r) => r.ownerId === playerId);
  const [createName, setCreateName] = useState('Mi casa');

  return (
    <div className="panel refuge-management-panel">
      <h3>Refuge Management</h3>
      {!hasMyRefuge && onCreateRefuge && (
        <div className="panel-create-refuge">
          <p className="panel-hint">Crea tu refugio 32×32 (tu casa).</p>
          <input
            type="text"
            className="panel-input"
            placeholder="Mi casa"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => onCreateRefuge(createName.trim() || 'Mi casa')}
          >
            {loading ? 'Creando…' : 'Crear mi casa'}
          </button>
        </div>
      )}
      {refuge ? (
        <>
          <div className="stat-row">
            <span className="stat-label">Refugio:</span>
            <span className="stat-value">{refuge.name ?? `#${refuge.id}`}</span>
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
