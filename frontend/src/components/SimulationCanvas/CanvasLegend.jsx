/**
 * Legend for canvas elements.
 */
import { SOLAR_COLOR, MINERAL_COLOR, PLAYER_COLOR } from './constants';

export function CanvasLegend({ isOwnedRefuge, currentZone }) {
  return (
    <div className="canvas-legend">
      <span className="legend-item"><span className="legend-dot" style={{ background: SOLAR_COLOR }} /> Solar</span>
      <span className="legend-item"><span className="legend-dot" style={{ background: MINERAL_COLOR }} /> Mineral</span>
      {isOwnedRefuge && (
        <>
          <span className="legend-item"><span className="legend-dot" style={{ background: PLAYER_COLOR }} /> WASD + E</span>
          {currentZone && <span className="legend-item" style={{ color: currentZone.color }}>{currentZone.name}</span>}
        </>
      )}
    </div>
  );
}
