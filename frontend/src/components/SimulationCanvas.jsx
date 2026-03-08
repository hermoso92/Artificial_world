/**
 * Simulation Canvas — 32x32 grid view for refuge interior.
 * Renders zones, furniture, pets, agents and player avatar.
 * Supports WASD movement, E to interact, edit mode for placing items.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const CELL = 16;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const AGENT_COLORS = ['#00d4ff', '#00e676', '#ffb74d', '#e040fb', '#ff5252'];
const SOLAR_COLOR = '#ffeb3b';
const MINERAL_COLOR = '#8d6e63';
const PLAYER_COLOR = '#00ff88';
const PET_COLOR = '#ff9800';

const FURNITURE_EMOJI = {
  bed: '\u{1F6CF}\uFE0F',
  table: '\u{1F37D}\uFE0F',
  fireplace: '\u{1F525}',
  sofa: '\u{1F6CB}\uFE0F',
};

const PLACE_TYPES = ['solar', 'mineral', 'bed', 'table', 'fireplace', 'sofa'];
const PLACE_LABELS = {
  solar: '\u2600\uFE0F Solar',
  mineral: '\u{1FAA8} Mineral',
  bed: '\u{1F6CF}\uFE0F Cama',
  table: '\u{1F37D}\uFE0F Mesa',
  fireplace: '\u{1F525} Chimenea',
  sofa: '\u{1F6CB}\uFE0F Sofá',
};

function getCanvasCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (rect.width > 0 ? canvas.width / rect.width : 1),
    y: (clientY - rect.top) * (rect.height > 0 ? canvas.height / rect.height : 1),
  };
}

function isAdjacentTo(px, py, tx, ty) {
  return Math.abs(px - tx) <= 1 && Math.abs(py - ty) <= 1 && !(px === tx && py === ty);
}

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

  // Refs for data that changes every tick — prevents keydown listener re-creation
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

  // Stable — reads from refs, never recreated
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
        fn(refugeIndexRef.current, adj.id).then((result) => {
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
        onPlaceFurniture?.(refugeIndex, placeType, gx, gy);
      }
      return;
    }
    const agent = agents?.find((a) => a.gridX === gx && a.gridY === gy);
    onSelectAgent?.(agent ?? null);
  };

  const currentZone = zones.find(
    (z) => playerPos.x >= z.x1 && playerPos.x <= z.x2 && playerPos.y >= z.y1 && playerPos.y <= z.y2
  );

  // --- Draw loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !refuge) return;
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 0, size, size);

    // Zones
    for (const z of zones) {
      const zw = (z.x2 - z.x1 + 1) * CELL;
      const zh = (z.y2 - z.y1 + 1) * CELL;
      const zx = z.x1 * CELL;
      const zy = z.y1 * CELL;
      ctx.fillStyle = z.color + '25';
      ctx.fillRect(zx, zy, zw, zh);
      ctx.strokeStyle = z.color + '70';
      ctx.lineWidth = 2;
      ctx.strokeRect(zx + 1, zy + 1, zw - 2, zh - 2);
      ctx.fillStyle = z.color + 'dd';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(z.name, zx + zw / 2, zy + 4);
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(size, i * CELL); ctx.stroke();
    }

    // Solar Flux
    for (const n of refuge.solarNodes ?? []) {
      const cx = (n.gridX + 0.5) * CELL;
      const cy = (n.gridY + 0.5) * CELL;
      ctx.fillStyle = SOLAR_COLOR + '22';
      ctx.strokeStyle = SOLAR_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, (n.radius ?? 2) * CELL, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Minerals
    for (const n of refuge.mineralNodes ?? []) {
      if (n.remaining <= 0) continue;
      ctx.fillStyle = MINERAL_COLOR;
      ctx.fillRect(n.gridX * CELL + 2, n.gridY * CELL + 2, CELL - 4, CELL - 4);
    }

    // Furniture
    const adjFurn = isOwnedRefuge
      ? furniture.find((f) => isAdjacentTo(playerPos.x, playerPos.y, f.gridX, f.gridY))
      : null;

    for (const f of furniture) {
      const fx = f.gridX * CELL;
      const fy = f.gridY * CELL;
      const isHighlighted = adjFurn && adjFurn.id === f.id;

      if (isHighlighted) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fillRect(fx, fy, CELL, CELL);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(fx + 1, fy + 1, CELL - 2, CELL - 2);
      }

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FURNITURE_EMOJI[f.type] ?? '?', fx + CELL / 2, fy + CELL / 2);
    }

    // Pets
    for (const pet of pets) {
      const px = (pet.gridX + 0.5) * CELL;
      const py = (pet.gridY + 0.5) * CELL;
      ctx.fillStyle = PET_COLOR;
      ctx.globalAlpha = pet.state === 'idle' ? 0.9 : 0.7;
      ctx.beginPath();
      ctx.arc(px, py, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F431}', px, py);
    }

    // Agents
    for (const a of agents ?? []) {
      const cx = (a.gridX + 0.5) * CELL;
      const cy = (a.gridY + 0.5) * CELL;
      const color = AGENT_COLORS[(a.lineageId ?? a.id) % AGENT_COLORS.length];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6 + (a.energy ?? 0) * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = selectedAgentId === a.id ? '#00d4ff' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = selectedAgentId === a.id ? 2 : 1;
      ctx.stroke();

      const label = a.stateLabel ?? a.state ?? '';
      if (label) {
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const tw = ctx.measureText(label).width;
        ctx.fillRect(cx - tw / 2 - 1, cy - CELL * 0.55 - 8, tw + 2, 9);
        ctx.fillStyle = color;
        ctx.fillText(label, cx, cy - CELL * 0.55);
      }

      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ccc';
      ctx.fillText(`#${a.id}`, cx, cy + CELL * 0.45);
    }

    // Player avatar
    if (isOwnedRefuge) {
      const px = (playerPos.x + 0.5) * CELL;
      const py = (playerPos.y + 0.5) * CELL;
      ctx.fillStyle = PLAYER_COLOR;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, CELL * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T\u00fa', px, py);
    }

    // HUD: stat bars (bottom-right of canvas)
    if (isOwnedRefuge && stats) {
      const barW = 60;
      const barH = 6;
      const gap = 10;
      const startX = size - barW - 8;
      let startY = size - 30;
      const statDefs = [
        { key: 'energy', label: 'E', color: '#00e676' },
        { key: 'hunger', label: 'H', color: '#ffb74d' },
        { key: 'mood',   label: 'M', color: '#42a5f5' },
      ];
      for (const sd of statDefs) {
        const val = stats[sd.key] ?? 0;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(startX - 12, startY - 1, barW + 14, barH + 2);
        ctx.fillStyle = '#666';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(sd.label, startX - 2, startY + barH / 2);
        ctx.fillStyle = '#333';
        ctx.fillRect(startX, startY, barW, barH);
        ctx.fillStyle = sd.color;
        ctx.fillRect(startX, startY, barW * (val / 100), barH);
        startY -= gap;
      }
    }

    ctx.textAlign = 'left';
  }, [refuge, agents, selectedAgentId, size, gridSize, isOwnedRefuge, playerPos, furniture, zones, pets, stats]);

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

      {isOwnedRefuge && (
        <div className="canvas-edit-controls" id="canvas-edit-controls">
          <button
            type="button"
            className={`canvas-edit-btn ${editMode ? 'active' : ''} ${furniture.length === 0 ? 'canvas-edit-btn--empty-house' : ''}`}
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
      )}

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

function StatBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="stat-bar-item">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-bar-value">{Math.round(pct)}</span>
    </div>
  );
}
