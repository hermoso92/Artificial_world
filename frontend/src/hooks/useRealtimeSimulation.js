/**
 * Hook for real-time simulation via WebSocket with exponential backoff reconnect.
 * Connects using the centralized WS_URL from config.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config/api';
import logger from '../utils/logger';

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

export function useRealtimeSimulation() {
  const [state, setState] = useState({ connected: false, tick: 0, refuge: null, agentCount: 0, running: false });
  const retryDelay = useRef(INITIAL_RETRY_MS);
  const retryTimer = useRef(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    logger.info('WebSocket connecting…', WS_URL);
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      logger.info('WebSocket connected');
      retryDelay.current = INITIAL_RETRY_MS;
      setState((s) => ({ ...s, connected: true }));
    };

    socket.onclose = (ev) => {
      logger.warn('WebSocket closed', { code: ev.code, reason: ev.reason });
      setState((s) => ({ ...s, connected: false }));
      if (ev.code !== 1000) {
        retryTimer.current = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_MS);
          connect();
        }, retryDelay.current);
      }
    };

    socket.onerror = () => {
      logger.error('WebSocket error');
      setState((s) => ({ ...s, connected: false }));
    };

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'simulation') {
          setState((s) => ({
            ...s,
            tick: msg.tick ?? s.tick,
            refuge: msg.refuge ?? s.refuge,
            agentCount: msg.agentCount ?? s.agentCount,
            running: msg.running ?? s.running,
          }));
        } else {
          logger.warn('Unknown WS message type', msg.type);
        }
      } catch (err) {
        logger.error('Failed to parse WS message', err);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      socketRef.current?.close(1000, 'component unmounted');
    };
  }, [connect]);

  return { ...state, reconnect: connect };
}
