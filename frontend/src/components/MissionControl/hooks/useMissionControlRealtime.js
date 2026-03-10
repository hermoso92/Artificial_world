import { useEffect } from 'react';
import { MISSION_CONTROL_WS_MESSAGE_TYPES, WS_URL } from '../../../config/api.js';
import { useMissionControlStore } from '../store/useMissionControlStore.js';
import logger from '../../../utils/logger.js';

export function useMissionControlRealtime() {
  const applyRealtimeMessage = useMissionControlStore((state) => state.applyRealtimeMessage);
  const setWsConnected = useMissionControlStore((state) => state.setWsConnected);
  const setWsState = useMissionControlStore((state) => state.setWsState);
  const setReconnectAttempt = useMissionControlStore((state) => state.setReconnectAttempt);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let cancelled = false;
    let attempt = 0;

    const scheduleReconnect = () => {
      if (cancelled) {
        return;
      }

      attempt += 1;
      setReconnectAttempt(attempt);
      setWsConnected(false);
      setWsState('reconnecting');

      const delayMs = Math.min(1000 * (2 ** Math.min(attempt - 1, 3)), 8000);
      reconnectTimer = window.setTimeout(() => {
        connect();
      }, delayMs);
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      setWsState(attempt > 0 ? 'reconnecting' : 'connecting');
      socket = new WebSocket(WS_URL);

      socket.addEventListener('open', () => {
        attempt = 0;
        setReconnectAttempt(0);
        setWsConnected(true);
        setWsState('online');
      });

      socket.addEventListener('close', () => {
        setWsConnected(false);
        scheduleReconnect();
      });

      socket.addEventListener('error', () => {
        setWsConnected(false);
        setWsState('degraded');
      });

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          if (
            message?.type === MISSION_CONTROL_WS_MESSAGE_TYPES.SNAPSHOT
            || message?.type === MISSION_CONTROL_WS_MESSAGE_TYPES.EVENT
          ) {
            applyRealtimeMessage(message);
          }
        } catch (err) {
          logger.warn('[MC WS] invalid message', { data: event.data, err: err.message });
          setWsState('degraded');
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [applyRealtimeMessage, setReconnectAttempt, setWsConnected, setWsState]);
}
