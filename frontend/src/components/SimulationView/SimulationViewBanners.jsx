/**
 * Banners and empty states for SimulationView.
 */
export function SimulationViewBanners({
  error,
  setError,
  setInitialLoad,
  fetchData,
  isOwnedRefuge,
  effectiveRefuge,
  effectiveAgents,
  furniture,
  onQuickStart,
  loading,
}) {
  return (
    <>
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-inline"
            onClick={() => {
              setError(null);
              setInitialLoad(true);
              fetchData();
            }}
          >
            Actualizar
          </button>
        </div>
      )}

      {isOwnedRefuge && (
        <div className="home-banner">
          <div className="home-banner-icon">🏠</div>
          <div className="home-banner-text">
            <strong>Estás en tu casa — {effectiveRefuge?.name ?? 'Mi casa'}</strong>
            <span className="home-banner-hint">
              Muévete con WASD · Pulsa E para usar muebles · Pulsa "Editar" para decorar
            </span>
          </div>
        </div>
      )}

      {!isOwnedRefuge && effectiveAgents.length === 0 && !error && (
        <div className="quick-start-banner">
          <span>Tu mundo está vacío. </span>
          <button
            type="button"
            className="btn btn-primary btn-inline"
            onClick={onQuickStart}
            disabled={loading}
          >
            Empezar rápido — crear especie y traer 5 habitantes
          </button>
        </div>
      )}

      {isOwnedRefuge && furniture.length === 0 && (
        <div className="home-empty-state" id="home-empty-state">
          <div className="home-empty-state-arrow" aria-hidden="true">↓</div>
          <p className="home-empty-state-main">
            Tu casa está vacía. Pulsa <strong>"Editar"</strong> debajo del mapa para colocar muebles.
          </p>
          <p className="home-empty-state-tip">
            Prueba a poner una <strong>Cama</strong> en el Dormitorio, una <strong>Mesa</strong> en la Cocina o un <strong>Sofá</strong> en el Salón.
          </p>
        </div>
      )}
    </>
  );
}
