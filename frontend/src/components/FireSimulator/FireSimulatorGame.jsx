/**
 * FireSimulatorGame — Loop de juego, canvas y telemetría.
 * Encapsula la lógica de física, render y controles.
 */
import { FireSimulatorTelemetry } from './FireSimulatorTelemetry';
import { useFireSimulatorGameLoop } from './useFireSimulatorGameLoop';
import { MAP_W, MAP_H } from './constants';

export function FireSimulatorGame({
  level,
  setLevelSelect,
  setWon,
  setFailed,
  onBack,
}) {
  const { canvasRef, telemetry, currentLevel } = useFireSimulatorGameLoop(level, setWon, setFailed);

  return (
    <div className="firesim firesim--playing">
      <div className="firesim-header">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <button className="firesim-level-btn" onClick={() => setLevelSelect(true)} title="Cambiar nivel">
          Nivel {level}
        </button>
        <FireSimulatorTelemetry telemetry={telemetry} />
        <span className="firesim-controls">WASD / flechas · L = sirena</span>
      </div>
      <div className="firesim-canvas-wrap">
        <canvas ref={canvasRef} className="firesim-canvas" width={MAP_W} height={MAP_H} />
      </div>
      <p className="firesim-mission">
        Nivel {level}: {currentLevel.desc}. Llega al incendio. Mapa de despacho arriba a la derecha.
      </p>
    </div>
  );
}
