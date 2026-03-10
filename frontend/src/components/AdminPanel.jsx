/**
 * Admin Panel — Modo dios. Solo ADMIN_PLAYER_IDS.
 * Operaciones: reset simulación, destruir mundos Hero, eliminar refugios, reset DobackSoft.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api, getPlayerId } from '../services/api.js';
import logger from '../utils/logger.js';

export function AdminPanel({ onBack }) {
  const { t } = useTranslation();
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
        setError(err.message ?? t('common.error_load'));
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
    if (!confirm(t('admin.confirm_destroy_world', { id: worldId }))) return;
    handleAction(() => api.adminHeroWorldDestroy(worldId), 'Destruir mundo');
  };

  if (error && !overview) {
    return (
      <div className="admin-panel">
        <div className="admin-error">
          <h2>{t('admin.access_denied')}</h2>
          <p>{error}</p>
          <p className="admin-hint">
            {t('admin.access_hint')} <code>{getPlayerId()}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.title')}</h1>
        <span className="admin-badge">{t('admin.badge')}</span>
      </div>

      {error && <p className="admin-error-msg">{error}</p>}

      {overview && (
        <div className="admin-overview">
          <section className="admin-section">
            <h3>{t('admin.section_simulation')}</h3>
            <p className="admin-stats">
              {t('admin.simulation_stats', {
                tick: overview.simulation.tick,
                refuges: overview.simulation.refugeCount,
                blueprints: overview.simulation.blueprintsCount,
              })}
            </p>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => handleAction(api.adminSimulationReset, 'Reset')}
              disabled={loading}
            >
              {loading && action === 'Reset' ? t('common.loading') : t('admin.reset_simulation')}
            </button>
          </section>

          <section className="admin-section">
            <h3>{t('admin.section_hero')}</h3>
            <p className="admin-stats">
              {t('admin.hero_stats', { alive: overview.hero.worldsCount, total: overview.hero.totalWorlds })}
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
                      {t('admin.destroy')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="admin-actions">
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  if (!confirm(t('admin.confirm_destroy_all'))) return;
                  handleAction(api.adminHeroWorldsWipe, 'Wipe');
                }}
                disabled={loading || overview.hero.worldsCount === 0}
              >
                {loading && action === 'Wipe' ? t('common.loading') : t('admin.destroy_all')}
              </button>
            </div>
          </section>

          <section className="admin-section">
            <h3>{t('admin.section_dobacksoft')}</h3>
            <p className="admin-stats">
              {t('admin.dobacksoft_stats', { count: overview.dobacksoft.citizensCount, max: overview.dobacksoft.maxCitizens })}
            </p>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => handleAction(api.adminDobackSoftReset, 'Reset DobackSoft')}
              disabled={loading}
            >
              {loading && action === 'Reset DobackSoft' ? t('common.loading') : t('admin.reset_citizens')}
            </button>
          </section>

          <section className="admin-section">
            <h3>{t('admin.section_audit')}</h3>
            <p className="admin-stats">{t('admin.audit_stats', { count: overview.audit.eventCount })}</p>
          </section>
        </div>
      )}

      <footer className="admin-footer">
        <p>{t('admin.player_id')} <code>{getPlayerId()}</code></p>
      </footer>
    </div>
  );
}
