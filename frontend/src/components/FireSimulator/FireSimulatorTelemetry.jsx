/**
 * Telemetry display for FireSimulatorGame.
 */
export function FireSimulatorTelemetry({ telemetry }) {
  return (
    <div className="firesim-telemetry">
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Velocidad</span>
        <span className="firesim-telemetry-value">{telemetry.speed} km/h</span>
      </div>
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Combustible</span>
        <span className={`firesim-telemetry-value ${telemetry.fuel < 25 ? 'firesim-low' : ''}`}>
          {telemetry.fuel}%
        </span>
      </div>
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Motor</span>
        <span className={`firesim-telemetry-value ${telemetry.engineTemp > 100 ? 'firesim-low' : ''}`}>
          {telemetry.engineTemp}°C
        </span>
      </div>
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Agua</span>
        <span className="firesim-telemetry-value">{telemetry.waterLevel}%</span>
      </div>
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Tiempo</span>
        <span className={`firesim-telemetry-value ${telemetry.timeLeft < 20 ? 'firesim-low' : ''}`}>
          {telemetry.timeLeft}s
        </span>
      </div>
      <div className="firesim-telemetry-item firesim-status">
        <span className="firesim-telemetry-label">Estado</span>
        <span className="firesim-telemetry-value">{telemetry.status}</span>
      </div>
      <div className="firesim-telemetry-item">
        <span className="firesim-telemetry-label">Sirena</span>
        <span className="firesim-telemetry-value">{telemetry.siren ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
}
