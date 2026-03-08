/**
 * Refuge simulation tick logic for Artificial Worlds.
 * Gather -> Decide -> Move -> Combat -> Reproduce -> Metabolism
 */
import { Agent } from './agent.js';

const COMBAT_ENERGY_COST = 0.05;
const REPRODUCTION_ENERGY_COST = 0.4;
const REPRODUCTION_MATTER_COST = 0.3;
const KILL_MATTER_GAIN = 0.2;
const KILL_ENERGY_GAIN = 0.1;
const MUTATION_VARIANCE = 0.1;

function manhattan(gx1, gy1, gx2, gy2) {
  return Math.abs(gx2 - gx1) + Math.abs(gy2 - gy1);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function tickRefuge(refuge, tick, addLog, onEvent) {
  const gridSize = refuge.gridSize;
  const agents = refuge.agents.filter((a) => !a.dead);

  if (refuge.getPlayerStats() && tick % 5 === 0) {
    refuge.decayStat('energy', 1);
    refuge.decayStat('hunger', 2);
    refuge.decayStat('mood', 1);
  }

  if (agents.length === 0) return;
  const emit = (type, payload) => onEvent?.(tick, type, payload);

  // 1. GATHER: Energy from Solar Flux, Matter from Mineral Deposits
  for (const agent of agents) {
    const solar = refuge.getSolarNodeAt(agent.gridX, agent.gridY);
    if (solar) {
      const gain = (solar.energyPerTick ?? 0.15) * (agent.gatheringRate ?? 1);
      agent.energy = Math.min(agent.maxEnergy, agent.energy + gain);
    }

    const mineral = refuge.getMineralNodeAt(agent.gridX, agent.gridY);
    if (mineral) {
      const extract = Math.min(0.1 * (agent.gatheringRate ?? 1), mineral.remaining);
      const taken = mineral.extract(extract);
      agent.matter = Math.min(agent.maxMatter, agent.matter + taken);
    }
  }

  // 2. METABOLISM: Energy drain
  for (const agent of agents) {
    agent.energy = Math.max(0, agent.energy - (agent.metabolism ?? 0.5) * 0.01);
    if (agent.energy <= 0) {
      agent.dead = true;
      addLog?.(`Agent ${agent.id} starved`, 'death');
      emit?.('agent_death', { agentId: agent.id, cause: 'starved' });
    }
  }

  // 3. COMBAT: Predators attack prey in same cell
  const liveAgents = refuge.agents.filter((a) => !a.dead);
  const cellMap = new Map();
  for (const a of liveAgents) {
    const key = `${a.gridX},${a.gridY}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push(a);
  }

  for (const [, occupants] of cellMap) {
    if (occupants.length < 2) continue;
    const predators = occupants.filter((a) => !a.dead && (a.attack ?? 0) > 0);
    for (const pred of predators) {
      if (pred.dead) continue;
      const others = occupants.filter((p) => !p.dead && p !== pred);
      const target = others.sort((a, b) => (a.defense ?? 0) - (b.defense ?? 0))[0];
      if (!target) continue;
      const damage = Math.max(0, (pred.attack ?? 0) - (target.defense ?? 0)) * 0.2;
      if (damage <= 0) continue;
      pred.energy = Math.max(0, pred.energy - COMBAT_ENERGY_COST);
      target.energy -= damage;
      if (target.energy <= 0) {
        target.dead = true;
        pred.matter = Math.min(pred.maxMatter, pred.matter + KILL_MATTER_GAIN);
        pred.energy = Math.min(pred.maxEnergy, pred.energy + KILL_ENERGY_GAIN);
        addLog?.(`Agent ${pred.id} killed Agent ${target.id}`, 'combat');
        emit?.('agent_combat', { predatorId: pred.id, preyId: target.id });
      }
    }
  }

  // 4. DECIDE & MOVE: Simple AI - move toward resources or wander
  const live = refuge.agents.filter((a) => !a.dead);
  const occupied = new Set(live.map((a) => `${a.gridX},${a.gridY}`));

  for (const agent of live) {
    if (agent.dead) continue;

    const solar = refuge.getSolarNodeAt(agent.gridX, agent.gridY);
    const mineral = refuge.getMineralNodeAt(agent.gridX, agent.gridY);

    if (agent.energy < 0.4 && !solar) {
      const nearest = findNearestSolar(refuge, agent.gridX, agent.gridY, occupied);
      if (nearest) moveToward(agent, nearest.gridX, nearest.gridY, gridSize, occupied);
    } else if (agent.matter < 0.4 && !mineral) {
      const nearest = findNearestMineral(refuge, agent.gridX, agent.gridY, occupied);
      if (nearest) moveToward(agent, nearest.gridX, nearest.gridY, gridSize, occupied);
    } else if (agent.energy < 0.6 && solar) {
      agent.state = 'gathering_energy';
    } else if (agent.matter < 0.6 && mineral) {
      agent.state = 'gathering_matter';
    } else {
      wander(agent, gridSize, occupied);
      agent.state = 'exploring';
    }
  }

  // 5. REPRODUCE
  const beforeReproduce = refuge.agents.filter((a) => !a.dead);
  for (const agent of beforeReproduce) {
    if (agent.dead || !agent.canReproduce) continue;
    const liveCount = refuge.agents.filter((a) => !a.dead).length;
    if (liveCount >= refuge.maxAgents) continue;

    const empty = findEmptyAdjacent(agent.gridX, agent.gridY, gridSize, occupied);
    if (!empty) continue;

    agent.energy -= REPRODUCTION_ENERGY_COST;
    agent.matter -= REPRODUCTION_MATTER_COST;

    const mutatedTraits = {
      ...agent.traits,
      movementSpeed: clamp(agent.traits.movementSpeed + (Math.random() - 0.5) * 2 * MUTATION_VARIANCE, 0.1, 2),
      metabolism: clamp(agent.traits.metabolism + (Math.random() - 0.5) * 2 * MUTATION_VARIANCE, 0.1, 2),
      attack: clamp(agent.traits.attack + (Math.random() - 0.5) * 2 * MUTATION_VARIANCE, 0, 2),
      defense: clamp(agent.traits.defense + (Math.random() - 0.5) * 2 * MUTATION_VARIANCE, 0, 2),
      gatheringRate: clamp(agent.traits.gatheringRate + (Math.random() - 0.5) * 2 * MUTATION_VARIANCE, 0.1, 2),
      reproductionThreshold: agent.traits.reproductionThreshold ?? 0.8,
    };

    const offspring = new Agent(empty.x, empty.y, { id: agent.blueprintId, traits: mutatedTraits }, agent.lineageId);
    offspring.birthTick = tick;
    refuge.agents.push(offspring);
    occupied.add(`${empty.x},${empty.y}`);
    addLog?.(`Agent ${agent.id} reproduced`, 'reproduce');
    emit?.('agent_reproduce', { parentId: agent.id, offspringId: offspring.id });
  }
}

function findNearestSolar(refuge, gx, gy, occupied) {
  let best = null;
  let bestDist = Infinity;
  for (const n of refuge.solarNodes) {
    const d = manhattan(gx, gy, n.gridX, n.gridY);
    if (d < bestDist && !occupied.has(`${n.gridX},${n.gridY}`)) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

function findNearestMineral(refuge, gx, gy, occupied) {
  let best = null;
  let bestDist = Infinity;
  for (const n of refuge.mineralNodes) {
    if (n.depleted) continue;
    const d = manhattan(gx, gy, n.gridX, n.gridY);
    if (d < bestDist && !occupied.has(`${n.gridX},${n.gridY}`)) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

function findEmptyAdjacent(gx, gy, gridSize, occupied) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const shuffled = dirs.sort(() => Math.random() - 0.5);
  for (const [dx, dy] of shuffled) {
    const nx = clamp(gx + dx, 0, gridSize - 1);
    const ny = clamp(gy + dy, 0, gridSize - 1);
    if (!occupied.has(`${nx},${ny}`)) return { x: nx, y: ny };
  }
  return null;
}

function moveToward(agent, tx, ty, gridSize, occupied) {
  const dx = Math.sign(tx - agent.gridX);
  const dy = Math.sign(ty - agent.gridY);
  const nx = clamp(agent.gridX + dx, 0, gridSize - 1);
  const ny = clamp(agent.gridY + dy, 0, gridSize - 1);
  const key = `${nx},${ny}`;
  if (occupied.has(key)) return;
  occupied.delete(`${agent.gridX},${agent.gridY}`);
  agent.gridX = nx;
  agent.gridY = ny;
  occupied.add(key);
}

function wander(agent, gridSize, occupied) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
  const nx = clamp(agent.gridX + dx, 0, gridSize - 1);
  const ny = clamp(agent.gridY + dy, 0, gridSize - 1);
  const key = `${nx},${ny}`;
  if (occupied.has(key)) return;
  occupied.delete(`${agent.gridX},${agent.gridY}`);
  agent.gridX = nx;
  agent.gridY = ny;
  occupied.add(key);
}
