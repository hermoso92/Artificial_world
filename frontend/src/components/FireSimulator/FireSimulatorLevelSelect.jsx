/** FireSimulatorLevelSelect — Selección de nivel */
import { LEVELS } from './constants';

export function FireSimulatorLevelSelect({ onBack, initLevel }) {
  return (
    <div className="firesim">
      <div className="firesim-levels">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <h2 className="firesim-levels-title">📊 Selecciona nivel</h2>
        <p className="firesim-levels-desc">Escenarios de dificultad creciente</p>
        <div className="firesim-levels-grid">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className="firesim-level-card"
              onClick={() => initLevel(l.id)}
            >
              <span className="firesim-level-name">{l.name}</span>
              <span className="firesim-level-desc">{l.desc}</span>
              <span className="firesim-level-meta">
                {l.time}s · {l.fuel}% fuel · {l.cars} coches · {l.pedestrians} peatones
              </span>
              {l.accidents > 0 && <span className="firesim-level-badge">Accidentes</span>}
              {l.weather !== 'clear' && (
                <span className="firesim-level-weather">
                  {l.weather === 'rain' && '🌧️'}
                  {l.weather === 'fog' && '🌫️'}
                  {l.weather === 'storm' && '⛈️'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
