/**
 * Mission Control Agent Dashboard — table of live agents from GET /api/agents.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

export function MCAgentDashboard() {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        logger.warn('MCAgentDashboard: failed to fetch agents', err);
        setError(err.message);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
  }, []);

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
        No hay agentes vivos. Inicia la simulación y libera agentes desde el refugio.
      </div>
    );
  }

  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead>
          <tr>
            <th>ID</th>
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
