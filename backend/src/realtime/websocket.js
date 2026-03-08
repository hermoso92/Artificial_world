/**
 * WebSocket server for real-time simulation streaming.
 * Broadcasts tick, agents, refuge state to connected clients.
 */
import { WebSocketServer } from 'ws';
import { getWorld } from '../simulation/worldManager.js';
import { recordBroadcast } from '../services/diagnostics.js';
import logger from '../utils/logger.js';

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Artificial Worlds real-time stream',
      timestamp: new Date().toISOString(),
    }));

    // Send current state immediately so client has data even when paused
    try {
      const world = getWorld();
      const refuge = world.getActiveRefuge();
      const agentCount = refuge?.agents?.filter((a) => !a.dead).length ?? 0;
      ws.send(JSON.stringify({
        type: 'simulation',
        tick: world.tick,
        running: world.running,
        refuge: refuge?.toJSON?.() ?? null,
        agentCount,
      }));
      recordBroadcast(world.tick, agentCount);
    } catch (err) { logger.warn('[ws] Error enviando estado inicial:', err.message); }
  });

  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));
  return wss;
}

export function broadcastSimulationState(payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'simulation', ...payload });
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

export function broadcastEvent(eventType, data) {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'event', eventType, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

export function broadcastLog(level, message, source) {
  if (!wss) return;
  const msg = JSON.stringify({
    type: 'log',
    level,
    message,
    source: source ?? 'server',
    timestamp: new Date().toISOString(),
  });
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}
