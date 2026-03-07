/**
 * Banner de detección integrado.
 * Muestra alertas cuando el sistema detecta: estancamiento, agentes estáticos, WS desconectado.
 */
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import logger from '../utils/logger';

const POLL_MS = 3000;

export function DetectionBanner({ wsConnected, onRefresh }) {
  const [diagnostics, setDiagnostics] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const d = await api.getDiagnostics();
        setDiagnostics(d);
      } catch (err) {
        logger.warn('DetectionBanner: diagnostics fetch failed', err);
        setDiagnostics({ health: 'error', issues: [{ code: 'API_ERROR', message: 'No se pudo conectar al backend', severity: 'error' }] });
      }
    };

    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!diagnostics || dismissed) return null;

  const issues = [...(diagnostics.issues ?? [])];
  if (wsConnected === false && diagnostics.health !== 'error') {
    issues.unshift({
      code: 'WS_OFFLINE',
      message: 'WebSocket desconectado. Usando polling como respaldo.',
      severity: 'info',
    });
  }

  if (issues.length === 0) return null;

  const hasError = issues.some((i) => i.severity === 'error');
  const hasWarning = issues.some((i) => i.severity === 'warning');

  return (
    <div
      className={`detection-banner ${hasError ? 'detection-error' : hasWarning ? 'detection-warning' : 'detection-info'}`}
      role="alert"
    >
      <div className="detection-content">
        <span className="detection-icon">
          {hasError ? '⚠' : hasWarning ? '⚡' : 'ℹ'}
        </span>
        <div className="detection-messages">
          {issues.map((issue, i) => (
            <div key={i} className="detection-issue">
              {issue.message}
            </div>
          ))}
        </div>
        {onRefresh && (
          <button
            type="button"
            className="detection-refresh"
            onClick={() => { onRefresh(); setDismissed(true); }}
          >
            Actualizar
          </button>
        )}
        <button
          type="button"
          className="detection-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
