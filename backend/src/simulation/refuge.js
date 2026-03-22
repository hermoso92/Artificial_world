/**
 * Refuge model for Artificial Worlds.
 * Player-owned 32x32 simulation grid with agents, resource nodes,
 * interior zones, furniture, pets and player stats.
 */
import { Agent } from './agent.js';
import { SolarFluxNode, MineralDeposit } from './resourceNode.js';
import { getFurnitureType, applyEffect } from './furnitureCatalog.js';

const GRID_SIZE = 32;
const MAX_AGENTS = 50;
const MUTATION_VARIANCE = 0.1;

const DEFAULT_ZONES = [
  { id: 'entrance', name: 'Entrada',    x1: 0,  y1: 26, x2: 31, y2: 31, color: '#4a90d9' },
  { id: 'living',   name: 'Salón',      x1: 8,  y1: 12, x2: 23, y2: 25, color: '#e6a23c' },
  { id: 'bedroom',  name: 'Dormitorio', x1: 0,  y1: 0,  x2: 14, y2: 11, color: '#9b59b6' },
  { id: 'kitchen',  name: 'Cocina',     x1: 15, y1: 0,  x2: 31, y2: 11, color: '#2ecc71' },
];

function createDefaultStats() {
  // NOTE: playerStats lives in Refuge for MVP simplicity.
  // When multiple visitable refuges exist, migrate to a per-player store.
  return { energy: 100, hunger: 100, mood: 100 };
}

export class Refuge {
  static nextId = 1;
  static nextFurnitureId = 1;
  static nextPetId = 1;

  constructor(plotIndex, ownerId = null, name = null) {
    this.id = Refuge.nextId++;
    this.plotIndex = plotIndex;
    this.ownerId = ownerId;
    this.name = name ?? (ownerId ? 'Mi casa' : `Refugio ${plotIndex + 1}`);
    this.agents = [];
    this.solarNodes = [];
    this.mineralNodes = [];
    this.furniture = [];
    this.zones = ownerId ? DEFAULT_ZONES.map((z) => ({ ...z })) : [];
    this.pets = [];
    this.playerStats = ownerId ? createDefaultStats() : null;
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

  /** Añade nodo solar (solo en refugios con ownerId). */
  addSolarNode(gx, gy, radius = 2) {
    if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) return false;
    if (this._isOccupied(gx, gy)) return false;
    this.solarNodes.push(new SolarFluxNode(gx, gy, radius));
    return true;
  }

  /** Añade depósito mineral (solo en refugios con ownerId). */
  addMineralNode(gx, gy, capacity = 50) {
    if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) return false;
    if (this._isOccupied(gx, gy)) return false;
    this.mineralNodes.push(new MineralDeposit(gx, gy, capacity));
    return true;
  }

  /** Set of occupied cell keys for collision checks. */
  _getOccupiedSet() {
    return new Set([
      ...this.solarNodes.map((n) => `${n.gridX},${n.gridY}`),
      ...this.mineralNodes.filter((n) => !n.depleted).map((n) => `${n.gridX},${n.gridY}`),
      ...this.agents.filter((a) => !a.dead).map((a) => `${a.gridX},${a.gridY}`),
      ...this.furniture.map((f) => `${f.gridX},${f.gridY}`),
    ]);
  }

  _isOccupied(gx, gy) {
    return this._getOccupiedSet().has(`${gx},${gy}`);
  }

  // --- Interior: Furniture ---

  placeFurniture(type, gx, gy) {
    if (!getFurnitureType(type)) return null;
    if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) return null;
    if (this._isOccupied(gx, gy)) return null;
    const item = { id: Refuge.nextFurnitureId++, type, gridX: gx, gridY: gy, lastUsedAt: 0 };
    this.furniture.push(item);
    return item;
  }

  removeFurniture(furnitureId) {
    const idx = this.furniture.findIndex((f) => f.id === furnitureId);
    if (idx === -1) return null;
    return this.furniture.splice(idx, 1)[0];
  }

  getFurnitureAt(gx, gy) {
    return this.furniture.find((f) => f.gridX === gx && f.gridY === gy) ?? null;
  }

  getFurnitureById(furnitureId) {
    return this.furniture.find((f) => f.id === furnitureId) ?? null;
  }

  useFurniture(furnitureId) {
    if (!this.playerStats) return null;
    const item = this.getFurnitureById(furnitureId);
    if (!item) return null;
    const def = getFurnitureType(item.type);
    if (!def) return null;
    const now = Date.now();
    if (item.lastUsedAt && now - item.lastUsedAt < def.cooldownMs) {
      return { cooldown: true, remainingMs: def.cooldownMs - (now - item.lastUsedAt) };
    }
    item.lastUsedAt = now;
    const changes = this.applyStatChanges(def.effect);
    return { used: true, type: item.type, changes, stats: this.getPlayerStats() };
  }

  // --- Player Stats (encapsulated for future migration) ---

  getPlayerStats() {
    return this.playerStats ? { ...this.playerStats } : null;
  }

  applyStatChanges(effect) {
    if (!this.playerStats) return {};
    return applyEffect(this.playerStats, effect);
  }

  decayStat(key, amount) {
    if (!this.playerStats || !(key in this.playerStats)) return;
    this.playerStats[key] = Math.max(0, this.playerStats[key] - amount);
  }

  // --- Interior: Pets ---

  adoptPet(species = 'cat') {
    if (this.pets.some((p) => p.species === species)) return null;
    const pet = {
      id: Refuge.nextPetId++,
      species,
      gridX: 16,
      gridY: 16,
      state: 'idle',
    };
    this.pets.push(pet);
    return pet;
  }

  tickPets(playerX, playerY) {
    for (const pet of this.pets) {
      const dx = playerX - pet.gridX;
      const dy = playerY - pet.gridY;
      const dist = Math.abs(dx) + Math.abs(dy);

      if (dist <= 3 && dist > 1) {
        pet.state = 'follow';
        pet.gridX += Math.sign(dx);
        pet.gridY += Math.sign(dy);
      } else if (dist <= 1) {
        pet.state = 'idle';
      } else {
        pet.state = 'wander';
        const dirs = [[0,1],[0,-1],[1,0],[-1,0],[0,0],[0,0]];
        const [mx, my] = dirs[Math.floor(Math.random() * dirs.length)];
        const nx = Math.max(0, Math.min(this.gridSize - 1, pet.gridX + mx));
        const ny = Math.max(0, Math.min(this.gridSize - 1, pet.gridY + my));
        if (!this._isOccupied(nx, ny)) {
          pet.gridX = nx;
          pet.gridY = ny;
        }
      }

      if (dist <= 2) {
        this.applyStatChanges({ mood: 1 });
      }
    }
  }

  // --- Interior: Zones ---

  getZoneAt(gx, gy) {
    return this.zones.find(
      (z) => gx >= z.x1 && gx <= z.x2 && gy >= z.y1 && gy <= z.y2
    ) ?? null;
  }

  // --- Serialization ---

  toJSON() {
    return {
      id: this.id,
      plotIndex: this.plotIndex,
      ownerId: this.ownerId,
      name: this.name,
      gridSize: this.gridSize,
      maxAgents: this.maxAgents,
      agentCount: this.agents.filter((a) => !a.dead).length,
      agents: this.agents.filter((a) => !a.dead).map((a) => a.toJSON()),
      solarNodes: this.solarNodes.map((n) => n.toJSON()),
      mineralNodes: this.mineralNodes.map((n) => n.toJSON()),
      furniture: this.furniture,
      zones: this.zones,
      pets: this.pets,
      playerStats: this.getPlayerStats(),
    };
  }
}
