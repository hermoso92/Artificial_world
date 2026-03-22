/**
 * Sistema de detección integrado.
 * Detecta: simulación estancada, agentes sin movimiento, WebSocket sin broadcast.
 */
import { getWorld } from '../simulation/worldManager.js';
import { registrar as eventStoreRegistrar } from '../audit/eventStore.js';

const STAGNATION_TICKS = 3;
const STAGNATION_MS = 4000;

let lastTick = -1;
let lastAgentHash = '';
let lastBroadcastAt = 0;

export function recordBroadcast(tick, agentCount) {
  lastBroadcastAt = Date.now();
  lastTick = tick;
  lastAgentHash = computeAgentHash();
}

function computeAgentHash() {
  try {
    const world = getWorld();
    const refuge = world.getActiveRefuge();
    const agents = (refuge?.agents ?? []).filter((a) => !a.dead);
    const str = agents.map((a) => `${a.id}:${a.gridX},${a.gridY}`).sort().join('|');
    return str ? str.slice(0, 200) : 'empty';
  } catch {
    return '';
  }
}

export function runDiagnostics() {
  const issues = [];
  let health = 'ok';

  try {
    const world = getWorld();
    const refuge = world.getActiveRefuge();
    const agentCount = (refuge?.agents ?? []).filter((a) => !a.dead).length;
    const now = Date.now();
    const currentHash = computeAgentHash();

    // 1. Simulación corriendo pero tick no avanza
    if (world.running && lastTick >= 0) {
      const msSinceBroadcast = now - lastBroadcastAt;
      if (msSinceBroadcast > STAGNATION_MS) {
        issues.push({
          code: 'STAGNATION',
          message: `Simulación en ejecución pero sin actualizaciones desde hace ${Math.round(msSinceBroadcast / 1000)}s`,
          severity: 'warning',
        });
        health = health === 'ok' ? 'warning' : health;
      }
    }

    // 2. Agentes presentes pero posiciones no cambian (hash igual)
    if (world.running && agentCount > 0 && lastAgentHash && lastAgentHash === currentHash) {
      const msSinceBroadcast = now - lastBroadcastAt;
      if (msSinceBroadcast > STAGNATION_MS) {
        issues.push({
          code: 'AGENTS_STATIC',
          message: `${agentCount} agentes pero posiciones sin cambio`,
          severity: 'warning',
        });
        health = health === 'ok' ? 'warning' : health;
      }
    }

    // 3. Simulación corriendo con 0 agentes (esperado al inicio, no error)
    // 4. Registrar en audit si hay issues
    if (issues.length > 0) {
      eventStoreRegistrar(world.tick, 'detection', {
        issues,
        tick: world.tick,
        agentCount,
        lastBroadcastAt,
      }, { riskScore: 5, signals: ['detection_system'] });
    }

    return {
      health,
      issues,
      running: world.running,
      tick: world.tick,
      agentCount,
      refugeCount: world.refuges.length,
      lastBroadcastAt,
      uptime: Math.floor(process.uptime()),
    };
  } catch (err) {
    return {
      health: 'error',
      issues: [{ code: 'DIAG_ERROR', message: err.message, severity: 'error' }],
      running: false,
      tick: 0,
      agentCount: 0,
      refugeCount: 0,
      lastBroadcastAt: 0,
      uptime: Math.floor(process.uptime()),
    };
  }
}
