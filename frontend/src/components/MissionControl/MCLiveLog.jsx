/**
 * MCLiveLog — Real-time log stream from backend via WebSocket.
 * Shows server logs with level filtering, auto-scroll, and pause.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../../config/api';
import logger from '../../utils/logger.js';

const MAX_LOGS = 500;

const LEVEL_COLORS = {
  debug: '#8b8f98',
  info: '#00d4ff',
  warn: '#ffc107',
  error: '#ff4444',
};

const LEVEL_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

export function MCLiveLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const autoScrollRef = useRef(true);
  const pausedRef = useRef(false);

  pausedRef.current = paused;

  const scrollToBottom = useCallback(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'log') return;
          if (pausedRef.current) return;

          setLogs((prev) => {
            const next = [...prev, data];
            return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
          });
        } catch (err) {
          logger.debug('[MCLiveLog] non-json WS message', err.message);
        }
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter((l) => l.level === filter);

  const clearLogs = () => setLogs([]);

  return (
    <div className="mc-livelog">
      <div className="mc-livelog-toolbar">
        <div className="mc-livelog-status">
          <span className={`mc-livelog-dot ${connected ? 'mc-livelog-dot--on' : ''}`} />
          {connected ? 'En vivo' : 'Desconectado'}
        </div>

        <div className="mc-livelog-filters">
          {['all', 'info', 'warn', 'error', 'debug'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`mc-livelog-filter ${filter === lvl ? 'mc-livelog-filter--active' : ''}`}
              onClick={() => setFilter(lvl)}
            >
              {lvl === 'all' ? 'Todos' : lvl.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mc-livelog-actions">
          <button
            type="button"
            className={`mc-livelog-btn ${paused ? 'mc-livelog-btn--paused' : ''}`}
            onClick={() => { setPaused(!paused); autoScrollRef.current = true; }}
          >
            {paused ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
          <button type="button" className="mc-livelog-btn" onClick={clearLogs}>
            🗑 Limpiar
          </button>
          <span className="mc-livelog-count">{filteredLogs.length} logs</span>
        </div>
      </div>

      <div
        className="mc-livelog-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="mc-livelog-empty">
            {connected
              ? 'Esperando logs del servidor...'
              : 'Conectando al servidor...'}
          </div>
        ) : (
          filteredLogs.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className={`mc-livelog-entry mc-livelog-entry--${entry.level}`}
            >
              <span className="mc-livelog-time">
                {new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour12: false, fractionalSecondDigits: 1 })}
              </span>
              <span className="mc-livelog-level" style={{ color: LEVEL_COLORS[entry.level] }}>
                {LEVEL_ICONS[entry.level]} {entry.level.toUpperCase()}
              </span>
              <span className="mc-livelog-source">[{entry.source}]</span>
              <span className="mc-livelog-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
