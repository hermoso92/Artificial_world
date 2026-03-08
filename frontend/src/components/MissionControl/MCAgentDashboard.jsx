/**
 * Mission Control Agent Dashboard — table of live agents from GET /api/agents.
 * Shows blueprint name (species) for each agent.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

export function MCAgentDashboard() {
  const [agents, setAgents] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsData, bpList] = await Promise.all([
          api.getAgents(),
          api.getBlueprints(),
        ]);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setBlueprints(Array.isArray(bpList) ? bpList : []);
        setError(null);
      } catch (err) {
        logger.warn('MCAgentDashboard: failed to fetch', err);
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getBlueprintName = (blueprintId) => {
    const bp = blueprints.find((b) => b.id === blueprintId);
    return bp?.name ?? `Especie #${blueprintId ?? '?'}`;
  };

  if (error) {
    return (
      <div className="mc-empty">
        Error al cargar agentes: {error}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="mc-empty">
        Tu mundo está vacío. Dale vida y trae habitantes a tu refugio.
      </div>
    );
  }

  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Especie</th>
            <th>Posición</th>
            <th>Energía</th>
            <th>Materia</th>
            <th>Estado</th>
            <th>Linaje</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{getBlueprintName(a.blueprintId)}</td>
              <td>
                ({a.gridX ?? 0}, {a.gridY ?? 0})
              </td>
              <td>
                {((a.energy ?? 0) * 100).toFixed(0)}%
              </td>
              <td>
                {((a.matter ?? 0) * 100).toFixed(0)}%
              </td>
              <td>{a.state ?? 'idle'}</td>
              <td>{a.lineageId ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
