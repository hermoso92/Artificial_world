/**
 * Simulation Canvas - 32x32 grid view for Artificial Worlds refuge.
 * Supports zoom (0.5x–2x) via buttons and mouse wheel.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const CELL_SIZE = 16;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const AGENT_COLORS = ['#00d4ff', '#00e676', '#ffb74d', '#e040fb', '#ff5252'];
const SOLAR_COLOR = '#ffeb3b';
const MINERAL_COLOR = '#8d6e63';

function getCanvasCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function SimulationCanvas({ refuge, agents, selectedAgentId, onSelectAgent }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const gridSize = refuge?.gridSize ?? 32;
  const size = gridSize * CELL_SIZE;

  const handleZoom = useCallback((delta) => {
    setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta)));
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
    }
  }, [handleZoom]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !agents?.length) return;
    const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);
    const gx = Math.floor(x / CELL_SIZE);
    const gy = Math.floor(y / CELL_SIZE);
    const agent = agents.find((a) => a.gridX === gx && a.gridY === gy);
    onSelectAgent?.(agent ?? null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !refuge) return;

    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    const draw = () => {
      ctx.fillStyle = '#0a0b0d';
      ctx.fillRect(0, 0, size, size);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(size, i * CELL_SIZE);
        ctx.stroke();
      }

      // Solar Flux nodes
      for (const n of refuge.solarNodes ?? []) {
        const cx = (n.gridX + 0.5) * CELL_SIZE;
        const cy = (n.gridY + 0.5) * CELL_SIZE;
        const r = (n.radius ?? 2) * CELL_SIZE;
        ctx.fillStyle = SOLAR_COLOR + '22';
        ctx.strokeStyle = SOLAR_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Mineral Deposits
      for (const n of refuge.mineralNodes ?? []) {
        if (n.remaining <= 0) continue;
        const cx = (n.gridX + 0.5) * CELL_SIZE;
        const cy = (n.gridY + 0.5) * CELL_SIZE;
        ctx.fillStyle = MINERAL_COLOR;
        ctx.fillRect(n.gridX * CELL_SIZE + 2, n.gridY * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(n.gridX * CELL_SIZE + 2, n.gridY * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }

      // Agents
      for (const a of agents ?? []) {
        const cx = (a.gridX + 0.5) * CELL_SIZE;
        const cy = (a.gridY + 0.5) * CELL_SIZE;
        const color = AGENT_COLORS[(a.lineageId ?? a.id) % AGENT_COLORS.length];
        const alpha = 0.6 + (a.energy ?? 0) * 0.4;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = selectedAgentId === a.id ? '#00d4ff' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = selectedAgentId === a.id ? 2 : 1;
        ctx.stroke();
      }
      ctx.textAlign = 'left';
    };

    draw();
  }, [refuge, agents, selectedAgentId, size, gridSize]);

  return (
    <div className="canvas-wrap">
      <div className="canvas-zoom-controls">
        <button type="button" onClick={() => handleZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
        <span className="canvas-zoom-value">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => handleZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
      </div>
      <div
        className="canvas-zoom-container"
        onWheel={handleWheel}
        style={{ overflow: 'auto', maxWidth: '100%', maxHeight: '70vh' }}
      >
        <div
          style={{
            width: size,
            height: size,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && canvasRef.current?.focus()}
            aria-label="Refuge simulation grid. Click to select an agent."
            width={size}
            height={size}
            style={{
              background: '#0a0b0d',
              borderRadius: 8,
              display: 'block',
              cursor: agents?.length ? 'pointer' : 'default',
            }}
          />
        </div>
      </div>
      <div className="canvas-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: SOLAR_COLOR }} /> Solar Flux</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: MINERAL_COLOR }} /> Mineral</span>
      </div>
    </div>
  );
}
