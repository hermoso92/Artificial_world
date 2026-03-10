/**
 * RouteReplayView — Reproducción de ruta GPS real
 */
import { useState, useEffect, useRef } from 'react';
import { ROUTE_PADDING, TRUCK_W_ROUTE, TRUCK_H_ROUTE } from './constants';

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

export function RouteReplayView({ routeData, onBack, canvasW, canvasH }) {
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, [canvasW, canvasH]);

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
      ctx.fillRect(TRUCK_W_ROUTE / 3, -TRUCK_W_ROUTE / 2 - 6, 14, 10);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [routeData, points, totalDuration, canvasW, canvasH]);

  return (
    <div className="firesim firesim--playing">
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
