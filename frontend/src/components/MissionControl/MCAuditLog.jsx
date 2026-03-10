/**
 * Mission Control Audit Log — paginated audit events from GET /api/audit/events.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

export function MCAuditLog() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getAuditEvents({ limit: 100 });
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        logger.warn('MCAuditLog: failed to fetch audit events', err);
        setError(err.message);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="mc-empty">
        Error al cargar auditoría: {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mc-empty">
        No hay eventos de auditoría. Inicia la simulación para generar eventos.
      </div>
    );
  }

  const formatPayload = (p) => {
    if (!p || typeof p !== 'object') return '-';
    try {
      return JSON.stringify(p);
    } catch (err) {
      logger.debug('[MCAuditLog] bad payload', p);
      return '-';
    }
  };

  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead>
          <tr>
            <th>Tick</th>
            <th>Tipo</th>
            <th>Payload</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {[...events].reverse().map((e) => (
            <tr key={e.event_id}>
              <td>{e.tick ?? '-'}</td>
              <td>
                <span className={`mc-audit-type ${e.type ?? ''}`}>
                  {e.type ?? '-'}
                </span>
              </td>
              <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                {formatPayload(e.payload)}
              </td>
              <td>{e.risk_score ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
