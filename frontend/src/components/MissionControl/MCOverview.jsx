/**
 * Observatorio — Vista general de tu mundo.
 */
import { useState, useEffect } from 'react';
import { api, getPlayerId } from '../../services/api.js';
import { PricingModal } from '../PricingModal.jsx';
import { useMCOverviewActions } from './useMCOverviewActions.js';

export function MCOverview({ onEnterSimulation }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [blueprints, setBlueprints] = useState([]);
  const [refuges, setRefuges] = useState([]);
  const [selectedRefugeIndex, setSelectedRefugeIndex] = useState(0);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(null);
  const [releaseCount, setReleaseCount] = useState(5);
  const [createRefugeName, setCreateRefugeName] = useState('Mi refugio');
  const [pricingOpen, setPricingOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const refresh = async () => {
    try {
      const [d, bpList, refList] = await Promise.all([
        api.getStatus(),
        api.getBlueprints(),
        api.getRefuges(),
      ]);
      setData(d);
      setBlueprints(Array.isArray(bpList) ? bpList : []);
      setRefuges(Array.isArray(refList) ? refList : []);
      setError(null);
      if (selectedBlueprintId == null && bpList?.length > 0) {
        setSelectedBlueprintId(bpList[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const {
    releaseLoading,
    createRefugeLoading,
    actionFeedback,
    setActionFeedback,
    handleSelectRefuge,
    handleStartSimulation,
    handlePauseSimulation,
    handleResetSimulation,
    handleRelease,
    handleCreateBlueprint,
    handleCreateRefuge,
  } = useMCOverviewActions({
    selectedRefugeIndex,
    selectedBlueprintId,
    blueprints,
    refuges,
    releaseCount,
    refresh,
  });

  if (error) return <div className="mc-empty">Error al cargar estado: {error}</div>;
  if (!data) return <div className="mc-empty">Cargando...</div>;

  const formatUptime = (sec) => `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const currentBp = blueprints.find((b) => b.id === selectedBlueprintId) ?? blueprints[0];
  const playerId = getPlayerId();
  const myRefugeIndex = refuges.findIndex((r) => r.ownerId === playerId);

  return (
    <div className="mc-overview">
      <div className="mc-kpi-grid">
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Edad del mundo</div>
          <div className="mc-kpi-value accent">{data.tick}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Habitantes</div>
          <div className="mc-kpi-value">{data.agentCount}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Estado</div>
          <div className={`mc-kpi-value ${data.running ? 'success' : 'muted'}`}>
            {data.running ? 'Vivo' : 'En pausa'}
          </div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Refugios</div>
          <div className="mc-kpi-value">{data.refugeCount}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Tiempo vivo</div>
          <div className="mc-kpi-value">{formatUptime(data.uptime ?? 0)}</div>
        </div>
      </div>

      {actionFeedback && (
        <div className={`mc-feedback mc-feedback-${actionFeedback.type}`} role="status">
          {actionFeedback.msg}
          {actionFeedback.type === 'limit' && (
            <button className="mc-feedback-upgrade" onClick={() => setPricingOpen(true)}>
              ⭐ Mejorar plan
            </button>
          )}
        </div>
      )}

      <section className="mc-section">
        <h3 className="mc-section-title">Tus refugios</h3>
        {myRefugeIndex >= 0 ? (
          <p className="mc-hint">Tienes tu refugio: <strong>{refuges[myRefugeIndex]?.name ?? 'Mi casa'}</strong></p>
        ) : (
          <div className="mc-create-refuge">
            <input
              type="text"
              className="mc-release-input"
              placeholder="Nombre de tu refugio"
              value={createRefugeName}
              onChange={(e) => setCreateRefugeName(e.target.value)}
              style={{ minWidth: '12rem' }}
            />
            <button
              type="button"
              className="mc-btn mc-btn-primary"
              onClick={() => handleCreateRefuge(createRefugeName, () => setSelectedRefugeIndex(refuges.length))}
              disabled={createRefugeLoading}
            >
              {createRefugeLoading ? 'Construyendo…' : 'Crear mi refugio'}
            </button>
          </div>
        )}
        <div className="mc-refuge-list">
          {refuges.map((r, i) => (
            <div key={r.id ?? i} className={`mc-refuge-card ${r.ownerId === playerId ? 'mc-refuge-mine' : ''}`}>
              <button
                type="button"
                className={`mc-refuge-btn ${selectedRefugeIndex === i ? 'active' : ''}`}
                onClick={() => handleSelectRefuge(i, setSelectedRefugeIndex)}
              >
                {r.name ?? `Refugio ${i + 1}`}
                {r.ownerId === playerId && <span className="mc-refuge-badge">🏠 mío</span>}
                <span className="mc-refuge-agents">({r.agentCount ?? 0} habitantes)</span>
              </button>
              <button
                type="button"
                className="mc-btn mc-btn-entrar"
                onClick={async () => {
                  await handleSelectRefuge(i, setSelectedRefugeIndex);
                  onEnterSimulation?.();
                }}
                title="Entrar y ver la simulación"
              >
                Entrar →
              </button>
            </div>
          ))}
        </div>
        {onEnterSimulation && (
          <button
            type="button"
            className="mc-btn mc-btn-primary mc-enter-simulation"
            onClick={onEnterSimulation}
          >
            Entrar al mundo
          </button>
        )}
      </section>

      <div className="mc-quick-actions">
        {!data.running ? (
          <button type="button" className="mc-btn mc-btn-primary" onClick={handleStartSimulation}>
            Dar vida al mundo
          </button>
        ) : (
          <button type="button" className="mc-btn mc-btn-secondary" onClick={handlePauseSimulation}>
            Pausar el mundo
          </button>
        )}
        <button type="button" className="mc-btn mc-btn-outline" onClick={handleResetSimulation}>
          Empezar de cero
        </button>

        {blueprints.length === 0 ? (
          <button type="button" className="mc-btn mc-btn-primary" onClick={handleCreateBlueprint}>
            Crear nueva especie
          </button>
        ) : (
          <div className="mc-release-row">
            <select
              className="mc-select"
              value={selectedBlueprintId ?? currentBp?.id ?? ''}
              onChange={(e) => setSelectedBlueprintId(Number(e.target.value))}
            >
              {blueprints.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.name ?? `Especie ${bp.id}`}
                </option>
              ))}
            </select>
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
              Traer {releaseCount} habitantes
            </button>
          </div>
        )}
      </div>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentTier={subscription?.tier ?? 'free'}
        onSubscribed={() => { setPricingOpen(false); setActionFeedback(null); }}
      />
    </div>
  );
}
