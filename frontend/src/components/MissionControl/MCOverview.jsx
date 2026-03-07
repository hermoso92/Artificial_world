/**
 * Mission Control Overview — KPI cards (tick, agents, status, refuges).
 * Includes quick actions: Start simulation, Release agents.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

export function MCOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [blueprints, setBlueprints] = useState([]);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseCount, setReleaseCount] = useState(5);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const d = await api.getStatus();
        setData(d);
        setError(null);
      } catch (err) {
        logger.warn('MCOverview: failed to fetch status', err);
        setError(err.message);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error) return;
    const fetchBlueprints = async () => {
      try {
        const list = await api.getBlueprints();
        setBlueprints(Array.isArray(list) ? list : []);
      } catch {
        setBlueprints([]);
      }
    };
    fetchBlueprints();
  }, [error]);

  const handleStartSimulation = async () => {
    try {
      await api.startSimulation();
      const d = await api.getStatus();
      setData(d);
    } catch (err) {
      logger.warn('MCOverview: start simulation failed', err);
    }
  };

  const handleRelease = async () => {
    const bpId = blueprints[0]?.id;
    if (!bpId) return;
    setReleaseLoading(true);
    try {
      await api.releaseAgents(0, bpId, releaseCount);
      const d = await api.getStatus();
      setData(d);
    } catch (err) {
      logger.warn('MCOverview: release failed', err);
    } finally {
      setReleaseLoading(false);
    }
  };

  if (error) {
    return (
      <div className="mc-empty">
        Error al cargar estado: {error}
      </div>
    );
  }

  if (!data) {
    return <div className="mc-empty">Cargando...</div>;
  }

  const formatUptime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="mc-overview">
      <div className="mc-kpi-grid">
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Tick</div>
          <div className="mc-kpi-value accent">{data.tick}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Agentes vivos</div>
          <div className="mc-kpi-value">{data.agentCount}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Estado</div>
          <div className={`mc-kpi-value ${data.running ? 'success' : 'muted'}`}>
            {data.running ? 'En ejecución' : 'Pausado'}
          </div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Refugios</div>
          <div className="mc-kpi-value">{data.refugeCount}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Uptime</div>
          <div className="mc-kpi-value">{formatUptime(data.uptime ?? 0)}</div>
        </div>
      </div>

      <div className="mc-quick-actions">
        {!data.running && (
          <button
            type="button"
            className="mc-btn mc-btn-primary"
            onClick={handleStartSimulation}
          >
            Iniciar simulación
          </button>
        )}
        {blueprints.length > 0 && (
          <div className="mc-release-row">
            <input
              type="number"
              min={1}
              max={50}
              value={releaseCount}
              onChange={(e) => setReleaseCount(Number(e.target.value) || 5)}
              className="mc-release-input"
            />
            <button
              type="button"
              className="mc-btn mc-btn-secondary"
              onClick={handleRelease}
              disabled={releaseLoading}
            >
              Liberar {releaseCount} agentes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
