/**
 * Constants and helpers for SimulationCanvas.
 */
export const CELL = 16;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;
export const AGENT_COLORS = ['#00d4ff', '#00e676', '#ffb74d', '#e040fb', '#ff5252'];
export const SOLAR_COLOR = '#ffeb3b';
export const MINERAL_COLOR = '#8d6e63';
export const PLAYER_COLOR = '#00ff88';
export const PET_COLOR = '#ff9800';

export const FURNITURE_EMOJI = {
  bed: '\u{1F6CF}\uFE0F',
  table: '\u{1F37D}\uFE0F',
  fireplace: '\u{1F525}',
  sofa: '\u{1F6CB}\uFE0F',
};

export const PLACE_TYPES = ['solar', 'mineral', 'bed', 'table', 'fireplace', 'sofa'];
export const PLACE_LABELS = {
  solar: '\u2600\uFE0F Solar',
  mineral: '\u{1FAA8} Mineral',
  bed: '\u{1F6CF}\uFE0F Cama',
  table: '\u{1F37D}\uFE0F Mesa',
  fireplace: '\u{1F525} Chimenea',
  sofa: '\u{1F6CB}\uFE0F Sofá',
};

export function getCanvasCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (rect.width > 0 ? canvas.width / rect.width : 1),
    y: (clientY - rect.top) * (rect.height > 0 ? canvas.height / rect.height : 1),
  };
}

export function isAdjacentTo(px, py, tx, ty) {
  return Math.abs(px - tx) <= 1 && Math.abs(py - ty) <= 1 && !(px === tx && py === ty);
}
