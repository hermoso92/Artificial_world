/**
 * Mission Control System Monitor — world stats + recharts tick history.
 */
import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WS_URL } from '../../config/api.js';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

const HISTORY_SIZE = 20;

export function MCSystemMonitor() {
  const [world, setWorld] = useState(null);
  const [history, setHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchWorld = async () => {
      try {
        const data = await api.getWorld();
        setWorld(data);
      } catch (err) {
        logger.warn('MCSystemMonitor: failed to fetch world', err);
      }
    };

    fetchWorld();
    const interval = setInterval(fetchWorld, 3000);

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'simulation' && msg.tick != null) {
          setHistory((prev) => {
            const next = [...prev, { tick: msg.tick, agents: msg.agentCount ?? 0 }];
            return next.slice(-HISTORY_SIZE);
          });
        }
      } catch (err) {
        logger.error('MCSystemMonitor: failed to parse WS message', err);
      }
    };

    return () => {
      clearInterval(interval);
      socket?.close(1000, 'unmount');
    };
  }, []);

  if (!world) {
    return <div className="mc-empty">Cargando...</div>;
  }

  const blueprintCount = world.blueprints?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="mc-kpi-grid">
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Refugio activo</div>
          <div className="mc-kpi-value">{world.activeRefugeIndex ?? 0}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Blueprints</div>
          <div className="mc-kpi-value">{blueprintCount}</div>
        </div>
        <div className="mc-kpi-card">
          <div className="mc-kpi-label">Estado</div>
          <div className={`mc-kpi-value ${world.running ? 'success' : 'muted'}`}>
            {world.running ? 'Corriendo' : 'Pausado'}
          </div>
        </div>
      </div>

      <div className="mc-chart-wrap">
        <div className="mc-chart-title">Agentes por tick (últimos {HISTORY_SIZE})</div>
        {history.length === 0 ? (
          <div className="mc-empty" style={{ padding: '2rem' }}>
            Esperando datos del WebSocket. Inicia la simulación.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="tick" stroke="var(--color-muted)" fontSize={11} />
              <YAxis stroke="var(--color-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
                labelStyle={{ color: 'var(--color-muted)' }}
              />
              <Bar dataKey="agents" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
