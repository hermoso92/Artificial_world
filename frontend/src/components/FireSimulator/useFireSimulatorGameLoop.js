/**
 * Game loop for FireSimulatorGame: physics, render, telemetry.
 */
import { useEffect, useRef, useState } from 'react';
import {
  MAP_W,
  MAP_H,
  CELL,
  TRUCK_W,
  TRUCK_H,
  FIRE_R,
  MAX_SPEED,
  ACCEL,
  FRICTION,
  TURN_RATE,
  FUEL_DRAIN,
  LEVELS,
} from './constants';
import {
  buildCityGrid,
  getTrafficLights,
  spawnTraffic,
  spawnPedestrians,
  spawnAccidents,
  computeRoute,
} from './gameLogic';

export function useFireSimulatorGameLoop(level, setWon, setFailed, onBack) {
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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const cfg = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
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
        grad.addColorStop(0, 'rgba(200,220,240,0)');
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
  }, [level, currentLevel]);

  return { canvasRef, telemetry, currentLevel };
}
