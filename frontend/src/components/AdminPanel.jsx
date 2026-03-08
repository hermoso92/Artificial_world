/**
 * Admin Panel — Modo dios. Solo ADMIN_PLAYER_IDS.
 * Operaciones: reset simulación, destruir mundos Hero, eliminar refugios, reset DobackSoft.
 */
import { useState, useEffect } from 'react';
import { api, getPlayerId } from '../services/api.js';
import logger from '../utils/logger.js';

export function AdminPanel({ onBack }) {
  const [overview, setOverview] = useState(null);
  const [hero, setHero] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const fetchOverview = () => {
    setError(null);
    api.adminOverview()
      .then(setOverview)
      .catch((err) => {
        setError(err.message ?? 'Error al cargar');
        setOverview(null);
        logger.warn('Admin overview failed', err);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (overview) {
      api.getHero().then(setHero).catch(() => setHero(null));
    }
  }, [overview]);

  const handleAction = async (fn, label) => {
    setLoading(true);
    setAction(label);
    setError(null);
    try {
      await fn();
      fetchOverview();
    } catch (err) {
      setError(err.message ?? 'Error');
      logger.error('Admin action failed', err);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleDestroyWorld = (worldId) => {
    if (!confirm(`¿Destruir mundo ${worldId}?`)) return;
    handleAction(() => api.adminHeroWorldDestroy(worldId), 'Destruir mundo');
  };

  if (error && !overview) {
    return (
      <div className="admin-panel">
        <button className="back-btn" onClick={onBack}>← Constructor de Mundos</button>
        <div className="admin-error">
          <h2>Acceso denegado</h2>
          <p>{error}</p>
          <p className="admin-hint">
            Solo los administradores (ADMIN_PLAYER_IDS en .env) pueden acceder. Tu playerId: <code>{getPlayerId()}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>← Constructor de Mundos</button>
        <h1 className="admin-title">Panel Administrador</h1>
        <span className="admin-badge">Modo dios</span>
      </div>

      {error && <p className="admin-error-msg">{error}</p>}

      {overview && (
        <div className="admin-overview">
          <section className="admin-section">
            <h3>Simulación</h3>
            <p className="admin-stats">
              Tick: {overview.simulation.tick} · Refugios: {overview.simulation.refugeCount} · Blueprints: {overview.simulation.blueprintsCount}
            </p>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => handleAction(api.adminSimulationReset, 'Reset')}
              disabled={loading}
            >
              {loading && action === 'Reset' ? '...' : 'Reset simulación'}
            </button>
          </section>

          <section className="admin-section">
            <h3>Mundos Hero</h3>
            <p className="admin-stats">
              Vivos: {overview.hero.worldsCount} · Total: {overview.hero.totalWorlds}
            </p>
            {hero?.aliveWorlds?.length > 0 && (
              <ul className="admin-worlds-list">
                {hero.aliveWorlds.map((w) => (
                  <li key={w.id} className="admin-world-item">
                    <span>{w.name}</span>
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => handleDestroyWorld(w.id)}
                      disabled={loading}
                    >
                      Destruir
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="admin-actions">
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  if (!confirm('¿Destruir TODOS los mundos Hero?')) return;
                  handleAction(api.adminHeroWorldsWipe, 'Wipe');
                }}
                disabled={loading || overview.hero.worldsCount === 0}
              >
                {loading && action === 'Wipe' ? '...' : 'Destruir todos'}
              </button>
            </div>
          </section>

          <section className="admin-section">
            <h3>DobackSoft</h3>
            <p className="admin-stats">
              Ciudadanos: {overview.dobacksoft.citizensCount} / {overview.dobacksoft.maxCitizens}
            </p>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => handleAction(api.adminDobackSoftReset, 'Reset DobackSoft')}
              disabled={loading}
            >
              {loading && action === 'Reset DobackSoft' ? '...' : 'Reset ciudadanos'}
            </button>
          </section>

          <section className="admin-section">
            <h3>Auditoría</h3>
            <p className="admin-stats">Eventos: {overview.audit.eventCount}</p>
          </section>
        </div>
      )}

      <footer className="admin-footer">
        <p>PlayerId: <code>{getPlayerId()}</code></p>
      </footer>
    </div>
  );
}
