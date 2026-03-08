/**
 * Mission Control Activity Feed — live feed from WebSocket + GET /api/logs.
 */
import { useState, useEffect, useRef } from 'react';
import { WS_URL } from '../../config/api.js';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

const MAX_FEED_ITEMS = 100;

export function MCActivityFeed() {
  const [items, setItems] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await api.getLogs();
        const apiEntries = (Array.isArray(logs) ? logs : []).map((l) => ({
          tick: l.tick ?? 0,
          message: l.message ?? '',
          type: l.type ?? 'info',
          source: 'api',
        }));
        setItems((prev) => {
          const wsOnly = prev.filter((i) => i.source === 'ws');
          const combined = [...wsOnly, ...apiEntries];
          return combined
            .sort((a, b) => b.tick - a.tick)
            .slice(0, MAX_FEED_ITEMS);
        });
      } catch (err) {
        logger.warn('MCActivityFeed: failed to fetch logs', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'simulation') {
          const agents = msg.refuge?.agents ?? [];
          const stateCounts = {};
          for (const a of agents) {
            const lbl = a.stateLabel ?? a.state ?? 'idle';
            stateCounts[lbl] = (stateCounts[lbl] ?? 0) + 1;
          }
          const summary = Object.entries(stateCounts)
            .map(([k, v]) => `${v} ${k}`)
            .join(' · ');
          const entry = {
            tick: msg.tick ?? 0,
            message: `${msg.agentCount ?? agents.length} habitantes — ${summary || 'sin actividad'}`,
            type: 'simulation',
            source: 'ws',
          };
          setItems((prev) => [entry, ...prev].slice(0, MAX_FEED_ITEMS));
        } else if (msg.type === 'connected') {
          setItems((prev) => [
            { tick: 0, message: 'WebSocket conectado', type: 'system', source: 'ws' },
            ...prev,
          ].slice(0, MAX_FEED_ITEMS));
        }
      } catch (err) {
        logger.error('MCActivityFeed: failed to parse WS message', err);
      }
    };

    return () => {
      clearInterval(interval);
      socket?.close(1000, 'unmount');
    };
  }, []);

  return (
    <div className="mc-feed">
      {items.length === 0 ? (
        <div className="mc-empty">Sin actividad. Inicia la simulación.</div>
      ) : (
        items.map((item, i) => (
          <div
            key={`${item.tick}-${item.message}-${i}`}
            className={`mc-feed-item ${item.type}`}
          >
            <span className="mc-feed-tick">[{item.tick}]</span>
            {item.message}
          </div>
        ))
      )}
    </div>
  );
}
