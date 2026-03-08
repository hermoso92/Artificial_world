/**
 * Hook that draws refuge interior on canvas.
 */
import { useEffect } from 'react';
import {
  CELL,
  AGENT_COLORS,
  SOLAR_COLOR,
  MINERAL_COLOR,
  PLAYER_COLOR,
  PET_COLOR,
  FURNITURE_EMOJI,
  isAdjacentTo,
} from './constants';

export function useCanvasDrawing({
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
}) {
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
        { key: 'mood', label: 'M', color: '#42a5f5' },
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
}
