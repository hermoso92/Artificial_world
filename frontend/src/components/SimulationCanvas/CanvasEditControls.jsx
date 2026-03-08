/**
 * Edit mode controls for placing nodes and furniture.
 */
import { PLACE_TYPES, PLACE_LABELS } from './constants';

export function CanvasEditControls({ editMode, setEditMode, placeType, setPlaceType, isOwnedRefuge, furnitureCount }) {
  if (!isOwnedRefuge) return null;

  return (
    <div className="canvas-edit-controls" id="canvas-edit-controls">
      <button
        type="button"
        className={`canvas-edit-btn ${editMode ? 'active' : ''} ${furnitureCount === 0 ? 'canvas-edit-btn--empty-house' : ''}`}
        onClick={() => setEditMode((e) => !e)}
      >
        {editMode ? 'Cerrar editor' : 'Editar'}
      </button>
      {editMode && PLACE_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          className={`canvas-place-btn ${placeType === t ? 'active' : ''}`}
          onClick={() => setPlaceType(t)}
        >
          {PLACE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
