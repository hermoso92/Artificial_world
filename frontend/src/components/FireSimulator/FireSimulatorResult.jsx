/** FireSimulatorResult — Pantallas de victoria o derrota */
import { LEVELS } from './constants';

export function FireSimulatorWon({ onBack, level, resetGame, initLevel, setLevelSelect }) {
  return (
    <div className="firesim">
      <div className="firesim-won">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <h2 className="firesim-won-title">🎉 ¡Emergencia resuelta!</h2>
        <p className="firesim-won-desc">Nivel {level} completado. Tu comunidad está a salvo.</p>
        <div className="firesim-won-actions">
          <button className="firesim-replay-btn" onClick={resetGame}>
            Reintentar nivel
          </button>
          {level < LEVELS.length && (
            <button
              className="firesim-replay-btn firesim-next-btn"
              onClick={() => initLevel(level + 1)}
            >
              Siguiente nivel →
            </button>
          )}
          <button
            className="firesim-replay-btn firesim-levels-btn"
            onClick={() => setLevelSelect(true)}
          >
            Cambiar nivel
          </button>
        </div>
      </div>
    </div>
  );
}

export function FireSimulatorFailed({ onBack, failed, resetGame }) {
  const msg = failed === 'time'
    ? 'Se ha agotado el tiempo. La emergencia ha empeorado.'
    : 'Sin combustible. El camión se ha detenido.';
  return (
    <div className="firesim">
      <div className="firesim-won firesim-failed">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <h2 className="firesim-won-title">⚠️ Misión fallida</h2>
        <p className="firesim-won-desc">{msg}</p>
        <button className="firesim-replay-btn" onClick={resetGame}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
