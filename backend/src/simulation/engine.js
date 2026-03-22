/**
 * Simulation engine for Artificial Worlds.
 * Runs tick loop for AW-256 refuge simulation.
 */
import { getWorld } from './worldManager.js';
import { tickRefuge } from './refugeSimulation.js';
import { broadcastSimulationState } from '../realtime/websocket.js';
import { registrar as eventStoreRegistrar } from '../audit/eventStore.js';
import { recordBroadcast } from '../services/diagnostics.js';

export { getWorld };

const TICK_INTERVAL_MS = 1000;

let tickInterval = null;

function onSimEvent(tick, type, payload) {
  eventStoreRegistrar(tick, type, payload);
}

export function startSimulation() {
  const world = getWorld();
  if (world.running) return;
  world.running = true;
  world.addLog('Simulation started', 'system');
  onSimEvent(world.tick, 'sim_start', {});

  if (!tickInterval) {
    tickInterval = setInterval(() => {
      if (!world.running) return;
      world.tick++;
      const refuge = world.getActiveRefuge();
      const addLog = (msg, type) => world.addLog(msg, type);
      const onEvent = (tick, type, payload) => eventStoreRegistrar(tick, type, payload);
      if (refuge) {
        tickRefuge(refuge, world.tick, addLog, onEvent);
      }
      const activeRefuge = world.getActiveRefuge();
      const agentCount = activeRefuge?.agents?.filter((a) => !a.dead).length ?? 0;
      onSimEvent(world.tick, 'tick', { agentCount });
      broadcastSimulationState({
        tick: world.tick,
        running: world.running,
        refuge: activeRefuge?.toJSON(),
        agentCount,
      });
      recordBroadcast(world.tick, agentCount);
    }, TICK_INTERVAL_MS);
  }
}

export function pauseSimulation() {
  const world = getWorld();
  world.running = false;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  world.addLog('Simulation paused', 'system');
  onSimEvent(world.tick, 'sim_pause', {});
}

export function resetSimulation() {
  const world = getWorld();
  onSimEvent(world.tick, 'sim_reset', {});
  world.running = false;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  world.reset();
}
