/**
 * Fire Simulator — DobackSoft.
 * Mapa despacho, telemetría, paisajes 2D, incidentes, progresión por niveles.
 * Modo ruta real: cuando hay datos en sessionStorage (desde VisorRuta2D "Jugar esta ruta").
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const ACCESS_CODE_KEY = 'dobacksoft_access_code';
const ROUTE_SESSION_KEY = 'dobacksoft_route_session';
const ROUTE_DATA_KEY = 'dobacksoft_route_data';

const ROUTE_CANVAS_W = 960;
const ROUTE_CANVAS_H = 600;
const ROUTE_PADDING = 40;
const TRUCK_W_ROUTE = 44;
const TRUCK_H_ROUTE = 22;

function projectRoutePoints(route, canvasW, canvasH, padding) {
  if (!route?.length) return [];
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const rangeLat = maxLat - minLat || 0.0001;
  const rangeLng = maxLng - minLng || 0.0001;
  const w = canvasW - padding * 2;
  const h = canvasH - padding * 2;
  return route.map((p) => ({
    x: padding + ((p.lng - minLng) / rangeLng) * w,
    y: padding + h - ((p.lat - minLat) / rangeLat) * h,
    speed: p.speed ?? 0,
    timestamp: p.timestamp,
  }));
}
const ACCESS_CODE_REGEX = /^DOBACK-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
const DEMO_CODE = 'DEMO'; // Código directo para jugar sin cupón

function isValidAccessCode(code) {
  if (!code) return false;
  const c = String(code).trim().toUpperCase();
  if (c === DEMO_CODE) return true;
  return ACCESS_CODE_REGEX.test(c);
}

const MAP_W = 960;
const MAP_H = 600;
const CELL = 48;
const TRUCK_W = 44;
const TRUCK_H = 22;
const FIRE_R = 24;
const MAX_SPEED = 4.5;
const ACCEL = 0.35;
const FRICTION = 0.92;
const TURN_RATE = 0.055;
const FUEL_DRAIN = 0.012;

const LEVELS = [
  { id: 1, name: 'Nivel 1', time: 90, fuel: 100, cars: 6, pedestrians: 4, accidents: 0, weather: 'clear', desc: 'Introducción' },
  { id: 2, name: 'Nivel 2', time: 75, fuel: 85, cars: 10, pedestrians: 8, accidents: 1, weather: 'clear', desc: 'Más tráfico' },
  { id: 3, name: 'Nivel 3', time: 70, fuel: 80, cars: 14, pedestrians: 12, accidents: 2, weather: 'rain', desc: 'Lluvia' },
  { id: 4, name: 'Nivel 4', time: 65, fuel: 75, cars: 18, pedestrians: 16, accidents: 3, weather: 'fog', desc: 'Niebla' },
  { id: 5, name: 'Nivel 5', time: 60, fuel: 70, cars: 22, pedestrians: 20, accidents: 4, weather: 'storm', desc: 'Tormenta' },
];

function buildCityGrid() {
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

function getTrafficLights(grid) {
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

function spawnTraffic(grid, count) {
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

function spawnPedestrians(grid, count) {
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

function spawnAccidents(grid, count, firePos) {
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

function RouteReplayView({ routeData, onBack, canvasW, canvasH }) {
  const canvasRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [telemetry, setTelemetry] = useState({ speed: 0, progress: 0, status: 'Reproduciendo ruta' });

  const points = projectRoutePoints(routeData.route, canvasW, canvasH, ROUTE_PADDING);
  const totalDuration = (() => {
    if (points.length < 2) return 30;
    const first = new Date(points[0].timestamp || 0).getTime();
    const last = new Date(points[points.length - 1].timestamp || 0).getTime();
    return Math.max(30, (last - first) / 1000) * 0.5;
  })();

  useEffect(() => {
    let raf;
    const loop = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const t = Math.min(1, elapsed / totalDuration);
      const idx = t * (points.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, points.length - 1);
      const frac = idx - i0;
      const p0 = points[i0];
      const p1 = points[i1];
      const truckX = p0 && p1 ? p0.x + (p1.x - p0.x) * frac : p0?.x ?? 0;
      const truckY = p0 && p1 ? p0.y + (p1.y - p0.y) * frac : p0?.y ?? 0;
      const speed = p0 ? (p0.speed ?? 0) + ((p1?.speed ?? p0.speed ?? 0) - (p0.speed ?? 0)) * frac : 0;
      const angle = p0 && p1 ? Math.atan2(p1.y - p0.y, p1.x - p0.x) - Math.PI / 2 : 0;

      setTelemetry({
        speed: Math.round(speed),
        progress: Math.round(t * 100),
        status: t >= 1 ? 'Ruta completada' : 'Reproduciendo ruta',
      });

      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasW, canvasH);

      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.fillStyle = '#00d4ff';
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 || i === points.length - 1 ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      (routeData.events || []).forEach((e) => {
        const idx2 = routeData.route.findIndex(
          (p) => Math.abs(p.lat - e.lat) < 0.001 && Math.abs(p.lng - e.lng) < 0.001
        );
        const pt = idx2 >= 0 ? points[idx2] : projectRoutePoints([e], canvasW, canvasH, ROUTE_PADDING)[0];
        if (pt) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      ctx.save();
      ctx.translate(truckX ?? points[0]?.x ?? 0, truckY ?? points[0]?.y ?? 0);
      ctx.rotate(angle);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-TRUCK_W_ROUTE / 2, -TRUCK_H_ROUTE / 2, TRUCK_W_ROUTE, TRUCK_H_ROUTE);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(-TRUCK_W_ROUTE / 2, -TRUCK_H_ROUTE / 2, TRUCK_W_ROUTE, TRUCK_H_ROUTE);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(TRUCK_W_ROUTE / 3, -TRUCK_H_ROUTE / 2 - 6, 14, 10);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [routeData, points, totalDuration, canvasW, canvasH]);

  return (
    <div className="firesim">
      <div className="firesim-header">
        <button className="back-btn" onClick={onBack}>← Volver a rutas</button>
        <span className="firesim-route-badge">Modo ruta real</span>
        <div className="firesim-telemetry">
          <div className="firesim-telemetry-item">
            <span className="firesim-telemetry-label">Velocidad</span>
            <span className="firesim-telemetry-value">{telemetry.speed} km/h</span>
          </div>
          <div className="firesim-telemetry-item">
            <span className="firesim-telemetry-label">Progreso</span>
            <span className="firesim-telemetry-value">{telemetry.progress}%</span>
          </div>
          <div className="firesim-telemetry-item firesim-status">
            <span className="firesim-telemetry-label">Estado</span>
            <span className="firesim-telemetry-value">{telemetry.status}</span>
          </div>
        </div>
      </div>
      <div className="firesim-canvas-wrap">
        <canvas ref={canvasRef} className="firesim-canvas" width={canvasW} height={canvasH} />
      </div>
      <p className="firesim-mission">
        Reproducción de la ruta real. El camión sigue el recorrido GPS.
      </p>
    </div>
  );
}

function computeRoute(truck, fire, accidents) {
  const steps = [];
  let cx = truck.x;
  let cy = truck.y;
  const dx = fire.x - cx;
  const dy = fire.y - cy;
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

export function FireSimulator({ onBack, accessCodeFromParent }) {
  const [routeData, setRouteData] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' && sessionStorage.getItem(ROUTE_DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.route?.length) setRouteData(data);
      }
    } catch (_) { /* ignore */ }
  }, []);

  const clearRouteAndBack = useCallback(() => {
    try {
      sessionStorage.removeItem(ROUTE_SESSION_KEY);
      sessionStorage.removeItem(ROUTE_DATA_KEY);
    } catch (_) { /* ignore */ }
    setRouteData(null);
    onBack?.();
  }, [onBack]);

  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState(null);
  const [level, setLevel] = useState(1);
  const [levelSelect, setLevelSelect] = useState(true);
  const [won, setWon] = useState(false);
  const [failed, setFailed] = useState(null);
  const [telemetry, setTelemetry] = useState({
    speed: 0, fuel: 100, timeLeft: 90, status: 'En ruta',
    engineTemp: 85, waterLevel: 100, siren: false,
  });
  const canvasRef = useRef(null);
  const startTimeRef = useRef(null);
  const gridRef = useRef(buildCityGrid());
  const lightsRef = useRef([]);
  const carsRef = useRef([]);
  const pedsRef = useRef([]);
  const accidentsRef = useRef([]);
  const gameRef = useRef({
    truck: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, fuel: 100, siren: false },
    fire: { x: 0, y: 0 },
    keys: {},
  });

  const currentLevel = LEVELS.find((l) => l.id === level) ?? LEVELS[0];

  const checkAccess = useCallback(() => {
    const fromParent = accessCodeFromParent && isValidAccessCode(accessCodeFromParent);
    const fromStorage = typeof window !== 'undefined' && isValidAccessCode(localStorage.getItem(ACCESS_CODE_KEY));
    return fromParent || fromStorage;
  }, [accessCodeFromParent]);

  useEffect(() => {
    if (accessCodeFromParent && isValidAccessCode(accessCodeFromParent)) {
      localStorage.setItem(ACCESS_CODE_KEY, accessCodeFromParent.trim().toUpperCase());
      setHasAccess(true);
    } else if (checkAccess()) {
      setHasAccess(true);
    }
  }, [accessCodeFromParent, checkAccess]);

  const handleUnlock = () => {
    setAccessError(null);
    const code = accessInput.trim().toUpperCase();
    if (!isValidAccessCode(code)) {
      setAccessError('Formato: DOBACK-XXXX-XXXX o código DEMO');
      return;
    }
    localStorage.setItem(ACCESS_CODE_KEY, code === DEMO_CODE ? 'DOBACK-DEMO-PLAY' : code);
    setHasAccess(true);
    setAccessInput('');
  };

  const initLevel = useCallback((lvl) => {
    const cfg = LEVELS.find((l) => l.id === lvl) ?? LEVELS[0];
    const grid = buildCityGrid();
    const fire = { x: MAP_W - CELL * 3, y: MAP_H / 2 };
    gridRef.current = grid;
    lightsRef.current = getTrafficLights(grid);
    carsRef.current = spawnTraffic(grid, cfg.cars);
    pedsRef.current = spawnPedestrians(grid, cfg.pedestrians);
    accidentsRef.current = spawnAccidents(grid, cfg.accidents, fire);
    gameRef.current = {
      truck: { x: CELL * 2 + CELL / 2, y: MAP_H / 2, vx: 0, vy: 0, angle: -Math.PI / 2, fuel: cfg.fuel, siren: false },
      fire,
      keys: {},
    };
    startTimeRef.current = Date.now();
    setLevel(lvl);
    setLevelSelect(false);
    setWon(false);
    setFailed(null);
  }, []);

  const resetGame = useCallback(() => {
    initLevel(level);
  }, [initLevel, level]);

  useEffect(() => {
    if (!hasAccess || won || failed) return;

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        gameRef.current.keys[e.code] = true;
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        gameRef.current.truck.siren = !gameRef.current.truck.siren;
      }
    };
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasAccess, won, failed]);

  useEffect(() => {
    if (!hasAccess || won || failed || levelSelect) return;
    if (!startTimeRef.current) initLevel(level);

    let raf;
    const loop = () => {
      const g = gameRef.current;
      const { truck, fire, keys } = g;
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const timeLeft = Math.max(0, currentLevel.time - elapsed);

      if (timeLeft <= 0) {
        setFailed('time');
        return;
      }
      if (truck.fuel <= 0) {
        setFailed('fuel');
        return;
      }

      const speed = Math.sqrt(truck.vx * truck.vx + truck.vy * truck.vy);
      truck.fuel -= FUEL_DRAIN * (1 + speed * 0.15);

      if (keys.ArrowUp || keys.KeyW) {
        truck.vx += Math.cos(truck.angle) * ACCEL;
        truck.vy += Math.sin(truck.angle) * ACCEL;
      }
      if (keys.ArrowDown || keys.KeyS) {
        truck.vx -= Math.cos(truck.angle) * ACCEL * 0.6;
        truck.vy -= Math.sin(truck.angle) * ACCEL * 0.6;
      }
      if (keys.ArrowLeft || keys.KeyA) truck.angle -= TURN_RATE * (1 + speed * 0.3);
      if (keys.ArrowRight || keys.KeyD) truck.angle += TURN_RATE * (1 + speed * 0.3);

      truck.vx *= FRICTION;
      truck.vy *= FRICTION;
      const maxV = MAX_SPEED * (truck.fuel / 100);
      const v = Math.sqrt(truck.vx * truck.vx + truck.vy * truck.vy);
      if (v > maxV) {
        const s = maxV / v;
        truck.vx *= s;
        truck.vy *= s;
      }
      truck.x += truck.vx;
      truck.y += truck.vy;

      const inAccident = accidentsRef.current.some((a) =>
        Math.abs(truck.x - a.x) < a.w / 2 + TRUCK_W / 2 && Math.abs(truck.y - a.y) < a.h / 2 + TRUCK_H / 2
      );
      if (inAccident) {
        truck.vx *= 0.6;
        truck.vy *= 0.6;
      }

      truck.x = Math.max(CELL, Math.min(MAP_W - CELL, truck.x));
      truck.y = Math.max(CELL, Math.min(MAP_H - CELL, truck.y));

      carsRef.current.forEach((car) => {
        const d = Math.hypot(truck.x - car.x, truck.y - car.y);
        if (d < 35) {
          truck.vx *= 0.7;
          truck.vy *= 0.7;
        }
      });

      const dx = fire.x - truck.x;
      const dy = fire.y - truck.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < FIRE_R + TRUCK_W / 2) {
        setWon(true);
      }

      lightsRef.current.forEach((l) => {
        l.t += 0.02;
        if (l.t > 8) l.t = 0;
        l.phase = l.t > 4 ? 1 : 0;
      });

      carsRef.current.forEach((car) => {
        const blocked = accidentsRef.current.some((a) =>
          Math.abs(car.x - a.x) < a.w + 20 && Math.abs(car.y - a.y) < a.h + 20
        );
        if (!blocked) {
          car.x += car.vx;
          car.y += car.vy;
        }
        if (car.x < 0 || car.x > MAP_W) car.vx *= -1;
        if (car.y < 0 || car.y > MAP_H) car.vy *= -1;
        car.x = Math.max(20, Math.min(MAP_W - 20, car.x));
        car.y = Math.max(20, Math.min(MAP_H - 20, car.y));
      });

      pedsRef.current.forEach((p) => {
        if (p.axis === 'x') {
          p.x += p.v;
          if (p.x < 0 || p.x > MAP_W) p.v *= -1;
        } else {
          p.y += p.v;
          if (p.y < 0 || p.y > MAP_H) p.v *= -1;
        }
      });

      const engineTemp = Math.min(120, 70 + speed * 8 + (truck.siren ? 5 : 0));
      const status = dist < 60 ? '¡Casi llegas!' : inAccident ? 'Accidente en ruta' : 'En ruta';

      setTelemetry({
        speed: Math.round(speed * 28),
        fuel: Math.max(0, Math.round(truck.fuel)),
        timeLeft: Math.ceil(timeLeft),
        status,
        engineTemp: Math.round(engineTemp),
        waterLevel: 100,
        siren: truck.siren,
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = MAP_W * dpr;
      canvas.height = MAP_H * dpr;
      canvas.style.width = `${MAP_W}px`;
      canvas.style.height = `${MAP_H}px`;
      ctx.scale(dpr, dpr);

      const grid = gridRef.current;
      const cols = grid[0]?.length ?? 0;
      const rows = grid?.length ?? 0;

      const weather = currentLevel.weather;
      if (weather === 'rain' || weather === 'storm') {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, MAP_W, MAP_H);
        for (let i = 0; i < 80; i++) {
          ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          const rx = (i * 37 + now / 50) % MAP_W;
          const ry = (i * 23 + now / 30) % MAP_H;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + 2, ry + 8);
          ctx.stroke();
        }
      }
      if (weather === 'fog' || weather === 'storm') {
        const fogAlpha = weather === 'storm' ? 0.25 : 0.2;
        const grad = ctx.createRadialGradient(MAP_W / 2, MAP_H / 2, 0, MAP_W / 2, MAP_H / 2, MAP_W);
        grad.addColorStop(0, `rgba(200,220,240,0)`);
        grad.addColorStop(0.5, `rgba(180,200,220,${fogAlpha})`);
        grad.addColorStop(1, `rgba(160,180,200,${fogAlpha * 1.5})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, MAP_W, MAP_H);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r]?.[c] ?? 0;
          const x = c * CELL;
          const y = r * CELL;
          if (cell === 0) {
            ctx.fillStyle = '#374151';
            ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, CELL, CELL);
          } else {
            const hue = (c * 17 + r * 31) % 360;
            ctx.fillStyle = `hsl(${hue}, 15%, 22%)`;
            ctx.fillRect(x, y, CELL, CELL);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let wy = 4; wy < CELL - 4; wy += 10) {
              for (let wx = 4; wx < CELL - 4; wx += 10) {
                ctx.fillRect(x + wx, y + wy, 6, 8);
              }
            }
          }
        }
      }

      accidentsRef.current.forEach((a) => {
        ctx.fillStyle = 'rgba(100,100,100,0.8)';
        ctx.fillRect(a.x - a.w / 2, a.y - a.h / 2, a.w, a.h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(a.x - a.w / 2, a.y - a.h / 2, a.w, a.h);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px sans-serif';
        ctx.fillText('ACCIDENTE', a.x - 24, a.y + 4);
      });

      lightsRef.current.forEach((l) => {
        ctx.fillStyle = l.phase === 0 ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      carsRef.current.forEach((car) => {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(Math.atan2(car.vy, car.vx));
        ctx.fillStyle = car.color;
        ctx.fillRect(-car.w / 2, -car.h / 2, car.w, car.h);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(car.w / 4, -car.h / 2 - 2, 8, 6);
        ctx.restore();
      });

      pedsRef.current.forEach((p) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.h / 3, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      const pulse = (now / 150) % 1;
      const grad = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, FIRE_R * 2.5);
      grad.addColorStop(0, `rgba(255,120,0,${0.95 - pulse * 0.2})`);
      grad.addColorStop(0.4, 'rgba(220,38,38,0.7)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, FIRE_R * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, FIRE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, FIRE_R * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(truck.x, truck.y);
      ctx.rotate(truck.angle);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-TRUCK_W / 2, -TRUCK_H / 2, TRUCK_W, TRUCK_H);
      ctx.strokeStyle = truck.siren ? '#fbbf24' : '#f97316';
      ctx.lineWidth = truck.siren ? 3 : 2;
      ctx.strokeRect(-TRUCK_W / 2, -TRUCK_H / 2, TRUCK_W, TRUCK_H);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(TRUCK_W / 3, -TRUCK_H / 2 - 6, 14, 10);
      if (truck.siren) {
        ctx.fillStyle = (now / 100) % 2 < 1 ? '#ef4444' : '#3b82f6';
        ctx.fillRect(-TRUCK_W / 2 + 4, -4, 6, 8);
        ctx.fillRect(-TRUCK_W / 2 + 4, 4, 6, 8);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-TRUCK_W / 2 + 4, -4, 6, 8);
        ctx.fillRect(-TRUCK_W / 2 + 4, 4, 6, 8);
      }
      ctx.restore();

      const route = computeRoute(truck, fire, accidentsRef.current);
      if (route.length > 1) {
        ctx.strokeStyle = 'rgba(34,197,94,0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(truck.x, truck.y);
        route.forEach((s) => ctx.lineTo(s.x, s.y));
        ctx.lineTo(fire.x, fire.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const MINIMAP_W = 140;
      const MINIMAP_H = 90;
      const mmx = MAP_W - MINIMAP_W - 12;
      const mmy = 12;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(mmx, mmy, MINIMAP_W, MINIMAP_H);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(mmx, mmy, MINIMAP_W, MINIMAP_H);
      const scale = Math.min(MINIMAP_W / MAP_W, MINIMAP_H / MAP_H);
      const offX = mmx + 8;
      const offY = mmy + 8;
      ctx.fillStyle = '#374151';
      ctx.fillRect(offX, offY, MAP_W * scale, MAP_H * scale);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(offX + truck.x * scale, offY + truck.y * scale, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(offX + fire.x * scale, offY + fire.y * scale, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('Despacho', mmx + 6, mmy + 14);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasAccess, won, failed, levelSelect, level, currentLevel, initLevel]);

  if (routeData?.route?.length) {
    return (
      <RouteReplayView
        routeData={routeData}
        onBack={clearRouteAndBack}
        canvasW={ROUTE_CANVAS_W}
        canvasH={ROUTE_CANVAS_H}
      />
    );
  }

  if (!hasAccess) {
    return (
      <div className="firesim">
        <div className="firesim-gate">
          <button className="back-btn" onClick={onBack}>← DobackSoft</button>
          <h2 className="firesim-gate-title">🚒 Fire Simulator</h2>
          <p className="firesim-gate-desc">
            Introduce <strong>DEMO</strong> para jugar directamente, o tu código DOBACK-XXXX-XXXX.
          </p>
          <div className="firesim-gate-row">
            <input
              type="text"
              className="firesim-gate-input"
              placeholder="DEMO"
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button className="firesim-gate-btn" onClick={handleUnlock}>
              Jugar
            </button>
          </div>
          {accessError && <p className="firesim-gate-error">{accessError}</p>}
        </div>
      </div>
    );
  }

  if (levelSelect) {
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

  if (won) {
    return (
      <div className="firesim">
        <div className="firesim-won">
          <button className="back-btn" onClick={onBack}>← DobackSoft</button>
          <h2 className="firesim-won-title">🎉 ¡Emergencia resuelta!</h2>
          <p className="firesim-won-desc">Nivel {level} completado. Tu comunidad está a salvo.</p>
          <div className="firesim-won-actions">
            <button className="firesim-replay-btn" onClick={resetGame}>
              Reintentar nivel
            </button>
            {level < LEVELS.length && (
              <button
                className="firesim-replay-btn firesim-next-btn"
                onClick={() => initLevel(level + 1)}
              >
                Siguiente nivel →
              </button>
            )}
            <button
              className="firesim-replay-btn firesim-levels-btn"
              onClick={() => setLevelSelect(true)}
            >
              Cambiar nivel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (failed) {
    const msg = failed === 'time' ? 'Se ha agotado el tiempo. La emergencia ha empeorado.' : 'Sin combustible. El camión se ha detenido.';
    return (
      <div className="firesim">
        <div className="firesim-won firesim-failed">
          <button className="back-btn" onClick={onBack}>← DobackSoft</button>
          <h2 className="firesim-won-title">⚠️ Misión fallida</h2>
          <p className="firesim-won-desc">{msg}</p>
          <button className="firesim-replay-btn" onClick={resetGame}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="firesim">
      <div className="firesim-header">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <button className="firesim-level-btn" onClick={() => setLevelSelect(true)} title="Cambiar nivel">
          Nivel {level}
        </button>
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
        <span className="firesim-controls">WASD / flechas · L = sirena</span>
      </div>
      <div className="firesim-canvas-wrap">
        <canvas ref={canvasRef} className="firesim-canvas" width={MAP_W} height={MAP_H} />
      </div>
      <p className="firesim-mission">
        Nivel {level}: {currentLevel.desc}. Llega al incendio. Mapa de despacho arriba a la derecha.
      </p>
    </div>
  );
}
