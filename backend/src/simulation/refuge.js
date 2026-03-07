/**
 * Refuge model for Artificial Worlds.
 * Player-owned 32x32 simulation grid with agents and resource nodes.
 */
import { Agent } from './agent.js';
import { SolarFluxNode, MineralDeposit } from './resourceNode.js';

const GRID_SIZE = 32;
const MAX_AGENTS = 50;
const MUTATION_VARIANCE = 0.1;

export class Refuge {
  static nextId = 1;

  constructor(plotIndex, ownerId = null) {
    this.id = Refuge.nextId++;
    this.plotIndex = plotIndex;
    this.ownerId = ownerId;
    this.agents = [];
    this.solarNodes = [];
    this.mineralNodes = [];
    this.gridSize = GRID_SIZE;
    this.maxAgents = MAX_AGENTS;
  }

  /** Initialize fixed node layout for MVP */
  initNodes() {
    this.solarNodes = [
      { x: 8, y: 8, r: 2 },
      { x: 24, y: 8, r: 2 },
      { x: 8, y: 24, r: 2 },
      { x: 24, y: 24, r: 2 },
    ].map(({ x, y, r }) => new SolarFluxNode(x, y, r));

    this.mineralNodes = [
      { x: 4, y: 4 }, { x: 28, y: 4 }, { x: 4, y: 28 }, { x: 28, y: 28 },
      { x: 16, y: 16 },
    ].map(({ x, y }) => new MineralDeposit(x, y, 50));
  }

  /** Release agents from blueprint into refuge. Spawns near Solar Flux for survival. */
  releaseAgents(blueprint, count = 5) {
    const slots = this.maxAgents - this.agents.filter((a) => !a.dead).length;
    const toAdd = Math.min(count, Math.max(0, slots));
    if (toAdd === 0) return 0;

    const occupied = new Set();
    for (const a of this.agents) {
      if (!a.dead) occupied.add(`${a.gridX},${a.gridY}`);
    }

    const SPAWN_RADIUS = 3;
    const safeSlots = [];
    for (const n of this.solarNodes) {
      const cx = n.gridX;
      const cy = n.gridY;
      for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
        for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
          const gx = Math.max(0, Math.min(this.gridSize - 1, cx + dx));
          const gy = Math.max(0, Math.min(this.gridSize - 1, cy + dy));
          const key = `${gx},${gy}`;
          if (!occupied.has(key)) safeSlots.push({ gx, gy, key });
        }
      }
    }
    const uniqueSlots = [...new Map(safeSlots.map((s) => [s.key, s])).values()];

    let added = 0;
    for (let i = 0; i < toAdd; i++) {
      let gx, gy, key;
      if (uniqueSlots.length > 0) {
        const idx = Math.floor(Math.random() * uniqueSlots.length);
        const slot = uniqueSlots.splice(idx, 1)[0];
        gx = slot.gx;
        gy = slot.gy;
        key = slot.key;
      } else {
        for (let attempt = 0; attempt < 20; attempt++) {
          gx = Math.floor(Math.random() * this.gridSize);
          gy = Math.floor(Math.random() * this.gridSize);
          key = `${gx},${gy}`;
          if (!occupied.has(key)) break;
        }
        if (occupied.has(`${gx},${gy}`)) continue;
      }

      const agent = new Agent(gx, gy, blueprint);
      this.agents.push(agent);
      occupied.add(`${gx},${gy}`);
      added++;
    }
    return added;
  }

  getSolarNodeAt(gx, gy) {
    return this.solarNodes.find((n) => n.contains(gx, gy)) ?? null;
  }

  getMineralNodeAt(gx, gy) {
    return this.mineralNodes.find((n) => n.gridX === gx && n.gridY === gy && !n.depleted) ?? null;
  }

  getAgentAt(gx, gy) {
    return this.agents.find((a) => !a.dead && a.gridX === gx && a.gridY === gy) ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      plotIndex: this.plotIndex,
      ownerId: this.ownerId,
      gridSize: this.gridSize,
      maxAgents: this.maxAgents,
      agentCount: this.agents.filter((a) => !a.dead).length,
      agents: this.agents.filter((a) => !a.dead).map((a) => a.toJSON()),
      solarNodes: this.solarNodes.map((n) => n.toJSON()),
      mineralNodes: this.mineralNodes.map((n) => n.toJSON()),
    };
  }
}
