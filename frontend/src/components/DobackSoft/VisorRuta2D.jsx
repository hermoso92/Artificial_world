/**
 * VisorRuta2D — Visualización 2D de rutas GPS.
 * Compatible con formato session-route de DobackSoft.
 * Funciona con datos mock cuando no hay backend de sesiones.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import logger from '../../utils/logger.js';
import { api } from '../../services/api.js';

const CANVAS_W = 800;
const CANVAS_H = 500;
const PADDING = 40;

/** Proyecta puntos lat/lng a coordenadas canvas (Mercator simplificado). */
function projectRoute(route, canvasW, canvasH, padding) {
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

/** Datos mock para demo sin backend DobackSoft. */
const MOCK_SESSIONS = [
  {
    id: 'mock-1',
    vehicleId: 'v1',
    vehicleName: 'Vehículo demo',
    startTime: '2025-03-08T10:00:00Z',
    endTime: '2025-03-08T10:30:00Z',
    distanceKm: 12.5,
    durationSeconds: 1800,
  },
];

const MOCK_ROUTE = {
  route: [
    { lat: 40.4168, lng: -3.7038, speed: 0, timestamp: '2025-03-08T10:00:00Z' },
    { lat: 40.418, lng: -3.702, speed: 25, timestamp: '2025-03-08T10:05:00Z' },
    { lat: 40.42, lng: -3.698, speed: 45, timestamp: '2025-03-08T10:10:00Z' },
    { lat: 40.422, lng: -3.695, speed: 50, timestamp: '2025-03-08T10:15:00Z' },
    { lat: 40.424, lng: -3.692, speed: 35, timestamp: '2025-03-08T10:20:00Z' },
    { lat: 40.426, lng: -3.688, speed: 40, timestamp: '2025-03-08T10:25:00Z' },
    { lat: 40.428, lng: -3.685, speed: 0, timestamp: '2025-03-08T10:30:00Z' },
  ],
  events: [
    { lat: 40.42, lng: -3.698, type: 'EXCESO_VELOCIDAD', severity: 'moderate' },
    { lat: 40.424, lng: -3.692, type: 'FRENAZO', severity: 'high' },
  ],
  session: MOCK_SESSIONS[0],
};

export function VisorRuta2D({ sessionId, onSelectSession, onPlayRoute }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const canvasRef = useRef(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDobackSoftSessions?.();
      if (data?.length) {
        setSessions(data);
        setUseMock(false);
      } else {
        setSessions(MOCK_SESSIONS);
        setUseMock(true);
      }
    } catch (err) {
      logger.warn('VisorRuta2D: no sessions API, using mock', err?.message);
      setSessions(MOCK_SESSIONS);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoute = useCallback(async (sid) => {
    if (!sid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDobackSoftSessionRoute?.(sid);
      if (data?.route) {
        setRouteData(data);
      } else {
        setRouteData(MOCK_ROUTE);
      }
    } catch (err) {
      logger.warn('VisorRuta2D: no route API, using mock', err?.message);
      setRouteData(MOCK_ROUTE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) {
      setSelectedSession(sessionId);
      loadRoute(sessionId);
    }
  }, [sessionId, loadRoute]);

  const handleSelectSession = (s) => {
    setSelectedSession(s.id);
    onSelectSession?.(s.id);
    loadRoute(s.id);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !routeData?.route?.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const points = projectRoute(routeData.route, CANVAS_W, CANVAS_H, PADDING);
    const eventPoints = (routeData.events || []).map((e) => {
      const idx = routeData.route.findIndex(
        (p) => Math.abs(p.lat - e.lat) < 0.001 && Math.abs(p.lng - e.lng) < 0.001
      );
      return idx >= 0 ? points[idx] : projectRoute([e], CANVAS_W, CANVAS_H, PADDING)[0];
    }).filter(Boolean);

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

    eventPoints.forEach((p) => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    return () => {};
  }, [routeData]);

  return (
    <div className="visor-ruta-2d">
      <div className="visor-ruta-header">
        <h3>📊 Visor de rutas</h3>
        {useMock && (
          <span className="visor-ruta-mock-badge" title="Datos de demostración. Conecta DobackSoft para datos reales.">
            Demo
          </span>
        )}
      </div>

      <div className="visor-ruta-layout">
        <aside className="visor-ruta-sessions">
          <h4>Sesiones</h4>
          {loading && !routeData ? (
            <p className="visor-ruta-loading">Cargando...</p>
          ) : (
            <ul className="visor-ruta-list">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className={`visor-ruta-session-item ${selectedSession === s.id ? 'active' : ''}`}
                  onClick={() => handleSelectSession(s)}
                >
                  <span className="visor-ruta-session-name">{s.vehicleName ?? s.vehicleId ?? s.id}</span>
                  <span className="visor-ruta-session-meta">
                    {s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : ''}
                    {s.durationSeconds != null ? ` · ${Math.round(s.durationSeconds / 60)} min` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="visor-ruta-canvas-area">
          {routeData ? (
            <>
              <canvas ref={canvasRef} className="visor-ruta-canvas" width={CANVAS_W} height={CANVAS_H} />
              <div className="visor-ruta-legend">
                <span><span className="legend-line" /> Ruta GPS</span>
                <span><span className="legend-event" /> Eventos</span>
              </div>
              {onPlayRoute && selectedSession && (
                <button
                  type="button"
                  className="visor-ruta-play-btn"
                  onClick={() => onPlayRoute(selectedSession, routeData)}
                >
                  🚒 Jugar esta ruta
                </button>
              )}
            </>
          ) : (
            <div className="visor-ruta-empty">
              {loading ? 'Cargando ruta...' : 'Selecciona una sesión para ver la ruta'}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
