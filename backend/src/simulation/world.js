/**
 * AW-256 World for Artificial Worlds.
 * 16x16 refuge plots; each refuge has 32x32 simulation grid.
 * MVP: single active refuge, grid-based simulation.
 */
import { Agent } from './agent.js';
import { Refuge } from './refuge.js';
import { Blueprint } from './blueprint.js';

const REFUGE_GRID = 32;
const WORLD_PLOTS = 256;
const TICK_RATE_MS = 1000;

export class World {
  constructor() {
    this.worldClass = 'AW-256';
    this.tick = 0;
    this.running = false;
    this.logs = [];
    this.maxLogs = 50;
    this.refuges = [];
    this.blueprints = [];
    this.activeRefugeIndex = 0;
    this._initRefuges();
    this._initBlueprints();
  }

  _initRefuges() {
    for (let i = 0; i < Math.min(16, WORLD_PLOTS); i++) {
      const refuge = new Refuge(i, null);
      refuge.initNodes();
      this.refuges.push(refuge);
    }
  }

  _initBlueprints() {
    if (this.blueprints.length > 0) return;
    this.createBlueprint('TestSpecies', {
      movementSpeed: 1,
      metabolism: 0.3,
      attack: 0,
      defense: 0,
      gatheringRate: 1.2,
      reproductionThreshold: 0.8,
    });
  }

  addLog(message, type = 'info') {
    this.logs.unshift({ tick: this.tick, message, type });
    if (this.logs.length > this.maxLogs) this.logs.pop();
  }

  getActiveRefuge() {
    return this.refuges[this.activeRefugeIndex] ?? this.refuges[0];
  }

  setActiveRefuge(index) {
    if (index >= 0 && index < this.refuges.length) {
      this.activeRefugeIndex = index;
    }
  }

  createBlueprint(name, traits) {
    const bp = new Blueprint(name, traits);
    this.blueprints.push(bp);
    return bp;
  }

  releaseAgents(refugeIndex, blueprintId, count = 5) {
    const refuge = this.refuges[refugeIndex ?? this.activeRefugeIndex];
    const blueprint = this.blueprints.find((b) => b.id === blueprintId);
    if (!refuge || !blueprint) return 0;
    const added = refuge.releaseAgents(blueprint, count);
    if (added > 0) this.addLog(`Released ${added} agents from "${blueprint.name}"`, 'release');
    return added;
  }

  reset() {
    Agent.nextId = 1;
    this.refuges = [];
    this._initRefuges();
    this.blueprints = [];
    this._initBlueprints();
    this.tick = 0;
    this.running = false;
    this.logs = [];
    this.addLog('World reset', 'system');
  }

  toJSON() {
    const refuge = this.getActiveRefuge();
    return {
      worldClass: this.worldClass,
      tick: this.tick,
      running: this.running,
      activeRefugeIndex: this.activeRefugeIndex,
      refugeCount: this.refuges.length,
      refuge: refuge?.toJSON() ?? null,
      blueprints: this.blueprints.map((b) => b.toJSON()),
    };
  }
}
