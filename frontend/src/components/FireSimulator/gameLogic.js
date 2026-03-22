/** Lógica de juego Fire Simulator: grid, tráfico, peatones, accidentes, ruta */
import { MAP_W, MAP_H, CELL } from './constants';

export function buildCityGrid() {
  const cols = Math.ceil(MAP_W / CELL);
  const rows = Math.ceil(MAP_H / CELL);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const isStreet = r % 3 === 1 || c % 3 === 1;
      row.push(isStreet ? 0 : 2);
    }
    grid.push(row);
  }
  return grid;
}

export function getTrafficLights(grid) {
  const lights = [];
  const cols = grid[0]?.length ?? 0;
  const rows = grid?.length ?? 0;
  for (let r = 1; r < rows; r += 3) {
    for (let c = 1; c < cols; c += 3) {
      if (grid[r]?.[c] === 0) {
        lights.push({
          x: c * CELL + CELL / 2,
          y: r * CELL + CELL / 2,
          phase: 0,
          t: (Math.floor(r / 3) + Math.floor(c / 3)) * 2,
        });
      }
    }
  }
  return lights;
}

export function spawnTraffic(grid, count) {
  const cars = [];
  const cols = grid[0]?.length ?? 0;
  const rows = grid?.length ?? 0;
  const spots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]?.[c] === 0) spots.push({ r, c, x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 });
    }
  }
  for (let i = 0; i < count && spots.length > 0; i++) {
    const idx = Math.floor(Math.random() * spots.length);
    const { x, y } = spots.splice(idx, 1)[0];
    const dir = Math.random() < 0.5 ? 0 : Math.PI / 2;
    cars.push({
      x, y,
      vx: Math.cos(dir) * 1.2,
      vy: Math.sin(dir) * 1.2,
      angle: dir,
      w: 28, h: 14,
      color: ['#3b82f6', '#22c55e', '#eab308', '#6b7280'][Math.floor(Math.random() * 4)],
    });
  }
  return cars;
}

export function spawnPedestrians(grid, count) {
  const peds = [];
  const cols = grid[0]?.length ?? 0;
  const rows = grid?.length ?? 0;
  const spots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]?.[c] === 2) {
        const onEdge = (r > 0 && grid[r - 1]?.[c] === 0) || (r < rows - 1 && grid[r + 1]?.[c] === 0) ||
          (c > 0 && grid[r]?.[c - 1] === 0) || (c < cols - 1 && grid[r]?.[c + 1] === 0);
        if (onEdge) spots.push({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, r, c });
      }
    }
  }
  for (let i = 0; i < count && spots.length > 0; i++) {
    const idx = Math.floor(Math.random() * spots.length);
    const { x, y } = spots.splice(idx, 1)[0];
    const dir = Math.random() < 0.5 ? 1 : -1;
    const axis = Math.random() < 0.5 ? 'x' : 'y';
    peds.push({ x, y, v: dir * 0.4, axis, w: 8, h: 16 });
  }
  return peds;
}

export function spawnAccidents(grid, count, firePos) {
  const accidents = [];
  const cols = grid[0]?.length ?? 0;
  const rows = grid?.length ?? 0;
  const spots = [];
  for (let r = 1; r < rows; r += 3) {
    for (let c = 1; c < cols; c += 3) {
      if (grid[r]?.[c] === 0) {
        const ax = c * CELL + CELL / 2;
        const ay = r * CELL + CELL / 2;
        if (Math.hypot(ax - firePos.x, ay - firePos.y) > 100) {
          spots.push({ x: ax, y: ay });
        }
      }
    }
  }
  for (let i = 0; i < count && spots.length > 0; i++) {
    const idx = Math.floor(Math.random() * spots.length);
    const { x, y } = spots.splice(idx, 1)[0];
    accidents.push({ x, y, w: 40, h: 24 });
  }
  return accidents;
}

export function computeRoute(truck, fire, accidents) {
  const steps = [];
  const dx = fire.x - truck.x;
  const dy = fire.y - truck.y;
  const dist = Math.hypot(dx, dy);
  const stepsCount = Math.min(12, Math.floor(dist / 40));
  for (let i = 1; i <= stepsCount; i++) {
    const t = i / stepsCount;
    let nx = truck.x + dx * t;
    let ny = truck.y + dy * t;
    const blocked = accidents.some((a) =>
      Math.abs(nx - a.x) < a.w && Math.abs(ny - a.y) < a.h
    );
    if (blocked) {
      const alt = Math.sin(i * 0.5) * 30;
      nx += alt;
      ny += alt * 0.5;
    }
    steps.push({ x: nx, y: ny });
  }
  return steps;
}
