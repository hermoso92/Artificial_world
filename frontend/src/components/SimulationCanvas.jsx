/**
 * Simulation Canvas — 32x32 grid view for refuge interior.
 * Renders zones, furniture, pets, agents and player avatar.
 * Supports WASD movement, E to interact, edit mode for placing items.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CELL,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  getCanvasCoords,
  isAdjacentTo,
} from './SimulationCanvas/constants';
import { useCanvasDrawing } from './SimulationCanvas/useCanvasDrawing';
import { CanvasEditControls } from './SimulationCanvas/CanvasEditControls';
import { CanvasLegend } from './SimulationCanvas/CanvasLegend';
import { StatBar } from './SimulationCanvas/StatBar';

export function SimulationCanvas({
  refuge,
  agents,
  selectedAgentId,
  onSelectAgent,
  isOwnedRefuge = false,
  onAddNode,
  onPlaceFurniture,
  onInteractFurniture,
  refugeIndex = 0,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [playerPos, setPlayerPos] = useState({ x: 16, y: 28 });
  const [editMode, setEditMode] = useState(false);
  const [placeType, setPlaceType] = useState('solar');
  const [feedbackText, setFeedbackText] = useState(null);
  const gridSize = refuge?.gridSize ?? 32;
  const size = gridSize * CELL;

  const furniture = refuge?.furniture ?? [];
  const zones = refuge?.zones ?? [];
  const pets = refuge?.pets ?? [];
  const stats = refuge?.playerStats;

  const refugeRef = useRef(refuge);
  const agentsRef = useRef(agents);
  const furnitureRef = useRef(furniture);
  const playerPosRef = useRef(playerPos);
  const isOwnedRef = useRef(isOwnedRefuge);
  const interactRef = useRef(onInteractFurniture);
  const refugeIndexRef = useRef(refugeIndex);

  useEffect(() => { refugeRef.current = refuge; }, [refuge]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);
  useEffect(() => { furnitureRef.current = furniture; }, [furniture]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { isOwnedRef.current = isOwnedRefuge; }, [isOwnedRefuge]);
  useEffect(() => { interactRef.current = onInteractFurniture; }, [onInteractFurniture]);
  useEffect(() => { refugeIndexRef.current = refugeIndex; }, [refugeIndex]);

  const isCellBlocked = useCallback((gx, gy) => {
    const r = refugeRef.current;
    const a = agentsRef.current;
    const f = furnitureRef.current;
    if ((r?.solarNodes ?? []).some((n) => n.gridX === gx && n.gridY === gy)) return true;
    if ((r?.mineralNodes ?? []).some((n) => n.gridX === gx && n.gridY === gy && (n.remaining ?? 50) > 0)) return true;
    if ((a ?? []).some((ag) => ag.gridX === gx && ag.gridY === gy)) return true;
    if ((f ?? []).some((fi) => fi.gridX === gx && fi.gridY === gy)) return true;
    return false;
  }, []);

  const handleZoom = useCallback((delta) => {
    setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta)));
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
    }
  }, [handleZoom]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isOwnedRef.current) return;
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
        e.preventDefault();
        let dx = 0, dy = 0;
        if (code === 'ArrowUp' || code === 'KeyW') dy = -1;
        if (code === 'ArrowDown' || code === 'KeyS') dy = 1;
        if (code === 'ArrowLeft' || code === 'KeyA') dx = -1;
        if (code === 'ArrowRight' || code === 'KeyD') dx = 1;
        setPlayerPos((p) => {
          const nx = Math.max(0, Math.min(gridSize - 1, p.x + dx));
          const ny = Math.max(0, Math.min(gridSize - 1, p.y + dy));
          if (isCellBlocked(nx, ny)) return p;
          return { x: nx, y: ny };
        });
      }
      if (code === 'KeyE') {
        e.preventDefault();
        const pos = playerPosRef.current;
        const furn = furnitureRef.current;
        const adj = furn.find((f) => isAdjacentTo(pos.x, pos.y, f.gridX, f.gridY)) ?? null;
        if (!adj) {
          setFeedbackText('Nada cerca para usar');
          setTimeout(() => setFeedbackText(null), 2000);
          return;
        }
        const fn = interactRef.current;
        if (!fn) return;
        fn(refugeIndexRef.current, adj.id, refugeRef.current?.id).then((result) => {
          if (result?.changes) {
            const parts = Object.entries(result.changes)
              .map(([k, v]) => `${v.delta > 0 ? '+' : ''}${v.delta} ${k}`)
              .join(', ');
            setFeedbackText(parts || 'Usado');
          } else if (result?.cooldown) {
            setFeedbackText('Espera un momento...');
          }
          setTimeout(() => setFeedbackText(null), 2000);
        }).catch(() => {
          setFeedbackText('No se pudo usar');
          setTimeout(() => setFeedbackText(null), 2000);
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gridSize, isCellBlocked]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);

    if (editMode && isOwnedRefuge) {
      if (isCellBlocked(gx, gy)) return;
      if (placeType === 'solar' || placeType === 'mineral') {
        onAddNode?.(refugeIndex, placeType, gx, gy);
      } else {
        onPlaceFurniture?.(refugeIndex, placeType, gx, gy, refuge?.id);
      }
      return;
    }
    const agent = agents?.find((a) => a.gridX === gx && a.gridY === gy);
    onSelectAgent?.(agent ?? null);
  };

  const currentZone = zones.find(
    (z) => playerPos.x >= z.x1 && playerPos.x <= z.x2 && playerPos.y >= z.y1 && playerPos.y <= z.y2
  );

  useCanvasDrawing({
    canvasRef,
    size,
    gridSize,
    refuge,
    agents,
    selectedAgentId,
    furniture,
    zones,
    pets,
    stats,
    playerPos,
    isOwnedRefuge,
  });

  return (
    <div className="canvas-wrap">
      <div className="canvas-zoom-controls">
        <button type="button" onClick={() => handleZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">{'\u2212'}</button>
        <span className="canvas-zoom-value">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => handleZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
      </div>
      <div className="canvas-zoom-container" onWheel={handleWheel} style={{ overflow: 'auto', maxWidth: '100%', maxHeight: '70vh' }}>
        <div style={{ width: size, height: size, transform: `scale(${zoom})`, transformOrigin: '0 0', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label="Refuge interior grid"
            width={size}
            height={size}
            style={{ background: '#0a0b0d', borderRadius: 8, display: 'block', cursor: 'pointer' }}
          />
          {feedbackText && (
            <div style={{
              position: 'absolute',
              top: (playerPos.y - 1) * CELL,
              left: (playerPos.x + 1) * CELL,
              color: '#00ff88',
              fontWeight: 'bold',
              fontSize: 13,
              textShadow: '0 0 4px #000, 0 0 8px #000',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              animation: 'fadeUp 2s ease-out forwards',
            }}>
              {feedbackText}
            </div>
          )}
        </div>
      </div>

      <CanvasLegend isOwnedRefuge={isOwnedRefuge} currentZone={currentZone} />

      <CanvasEditControls
        editMode={editMode}
        setEditMode={setEditMode}
        placeType={placeType}
        setPlaceType={setPlaceType}
        isOwnedRefuge={isOwnedRefuge}
        furnitureCount={furniture.length}
      />

      {isOwnedRefuge && stats && (
        <div className="refuge-stats-bar">
          <StatBar label="Energía" value={stats.energy} color="#00e676" />
          <StatBar label="Hambre" value={stats.hunger} color="#ffb74d" />
          <StatBar label="Ánimo" value={stats.mood} color="#42a5f5" />
        </div>
      )}
    </div>
  );
}
