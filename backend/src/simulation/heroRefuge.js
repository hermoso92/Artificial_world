/**
 * HeroRefuge — El refugio-origen del héroe.
 * Al crearse, genera automáticamente un Agente Personalizado (companion IA)
 * que opera en 13 modos de escala: personal → ia → galaxia.
 * Persists hero, companion and worlds to SQLite via db/database.js.
 */

import { randomUUID } from 'crypto';
import { generateAnswer, generateToolResultAnswer } from '../services/llmService.mjs';
import {
  getHeroByPlayer,
  getAliveWorldsByHero,
  getWorldsByHero,
  saveHeroState,
  ensurePlayer,
} from '../db/database.js';
import { getWorld } from './worldManager.js';
import {
  createFoundingWorldState,
  listCivilizationSeeds,
} from './civilizationSeeds.js';

const HERO_MODES = [
  { id: 'personal',    label: 'Yo',          icon: '🪞', scale: 1,   description: 'Tu espacio interior. Desde aquí nace todo.' },
  { id: 'empresa',     label: 'Taller',      icon: '🔨', scale: 2,   description: 'Organiza tu equipo y tus recursos.' },
  { id: 'comunidad',   label: 'Aldea',       icon: '🏘️', scale: 3,   description: 'Invita a tu gente. Construye lazos.' },
  { id: 'hogar',       label: 'Hogar',       icon: '🏠', scale: 4,   description: 'Tu base segura. Donde vuelves siempre.' },
  { id: 'cuarto',      label: 'Rincón',      icon: '🕯️', scale: 5,   description: 'Tu espacio más íntimo. Descansa e idea.' },
  { id: 'refugio',     label: 'Refugio',     icon: '🛡️', scale: 6,   description: 'Tu primer lugar en el mundo. Hazlo tuyo.' },
  { id: 'ecosistema',  label: 'Naturaleza',  icon: '🌿', scale: 7,   description: 'Biomas, cadenas de vida, equilibrio.' },
  { id: 'planeta',     label: 'Planeta',     icon: '🌍', scale: 8,   description: 'Un mundo completo con clima y civilizaciones.' },
  { id: 'mundo',       label: 'Mundo',       icon: '🌐', scale: 9,   description: 'Tu mundo. Con historia propia y memoria.' },
  { id: 'galaxia',     label: 'Galaxia',     icon: '🌌', scale: 10,  description: 'Mundos conectados entre sí.' },
  { id: 'persistencia',label: 'Legado',      icon: '📜', scale: 11,  description: 'Lo que queda cuando te vas. Tu huella.' },
  { id: 'ia',          label: 'Compañero',   icon: '🤝', scale: 12,  description: 'Tu IA. Aprende contigo, crece contigo.' },
  { id: 'nexo',        label: 'Todo',        icon: '✨', scale: 13,  description: 'Donde converge cada pieza de tu mundo.' },
];

class PersonalAgent {
  constructor(heroId, heroName) {
    this.id = `agent-${randomUUID()}`;
    this.heroId = heroId;
    this.heroName = heroName;
    this.name = `Compañero de ${heroName}`;
    this.activeMode = 'personal';
    this.memory = [];
    this.maxMemory = 100;
    this.traits = {
      loyalty: 1.0,
      curiosity: 0.8,
      adaptability: 0.9,
      creativity: 0.85,
    };
    this.createdAt = Date.now();
    this.interactions = 0;
  }

  switchMode(modeId) {
    const mode = HERO_MODES.find((m) => m.id === modeId);
    if (!mode) return false;
    this.activeMode = modeId;
    this._remember(`Switched to ${mode.label} mode`);
    return true;
  }

  _remember(event) {
    this.memory.unshift({ ts: Date.now(), event });
    if (this.memory.length > this.maxMemory) this.memory.pop();
  }

  async respond(query, context = {}, opts = {}) {
    this.interactions++;
    const mode = HERO_MODES.find((m) => m.id === this.activeMode);
    const { executeTool, aliveWorlds = [] } = opts;
    let answer = await this._generateAnswer(query, mode, context, aliveWorlds);

    if (answer.type === 'toolCall' && executeTool) {
      const toolName = answer.tool;
      const toolResult = await executeTool(toolName, answer.params);
      const answerText = await generateToolResultAnswer({
        query,
        tool: toolName,
        toolResult,
        heroName: this.heroName,
        mode,
      });
      this._remember(`Tool ${toolName} executed`);
      return {
        agent: this.name,
        mode: this.activeMode,
        modeLabel: mode?.label ?? this.activeMode,
        query,
        answer: answerText,
        ts: Date.now(),
      };
    }

    const response = {
      agent: this.name,
      mode: this.activeMode,
      modeLabel: mode?.label ?? this.activeMode,
      query,
      answer: answer.type === 'answer' ? answer.text : String(answer),
      ts: Date.now(),
    };
    this._remember(`Query: "${query.slice(0, 60)}"`);
    return response;
  }

  async _generateAnswer(query, mode, context, aliveWorlds = []) {
    const recentMemory = this.memory.slice(0, 5);
    return generateAnswer({
      query,
      heroName: this.heroName,
      mode,
      context: { ...context, worldCount: context.worldCount ?? aliveWorlds.length },
      recentMemory,
      aliveWorlds,
    });
  }

  toJSON() {
    return {
      id: this.id,
      heroId: this.heroId,
      heroName: this.heroName,
      name: this.name,
      activeMode: this.activeMode,
      traits: this.traits,
      interactions: this.interactions,
      memoryCount: this.memory.length,
      recentMemory: this.memory.slice(0, 5),
      createdAt: this.createdAt,
    };
  }
}

class ArtificialWorld {
  constructor(heroId, params = {}) {
    const foundingState = createFoundingWorldState({
      worldName: params.name ?? `World-${Date.now()}`,
      heroName: params.heroName,
      seedId: params.civilizationSeedId,
      refugeName: params.refugeName,
    });

    this.id = `world-${randomUUID()}`;
    this.heroId = heroId;
    this.name = params.name ?? `World-${Date.now()}`;
    this.type = params.type ?? 'standard';
    this.scale = params.scale ?? 'mundo';
    this.biomes = params.biomes ?? foundingState.civilizationSeed.defaultBiomes ?? ['forest', 'plains'];
    this.population = 0;
    this.resources = { energy: 1000, matter: 500, information: 200 };
    this.tick = 0;
    this.alive = true;
    this.createdAt = Date.now();
    this.destroyedAt = null;
    this.civilizationSeed = params.civilizationSeed ?? foundingState.civilizationSeed;
    this.foundingRefuge = params.foundingRefuge ?? foundingState.foundingRefuge;
    this.community = params.community ?? foundingState.community;
    this.heroes = params.heroes ?? foundingState.heroes;
    this.memoryEntries = params.memoryEntries ?? foundingState.memoryEntries;
    this.historicalRecords = params.historicalRecords ?? foundingState.historicalRecords;
    this.territory = params.territory ?? foundingState.territory;
    this.future3dHooks = params.future3dHooks ?? foundingState.future3dHooks;
    this.refugeName = this.foundingRefuge?.name ?? params.refugeName ?? 'Refugio inicial';
    this.history = params.history ?? [
      `World "${this.name}" created at tick 0`,
      `Seed chosen: ${this.civilizationSeed.label}`,
      `Founding refuge: ${this.refugeName}`,
    ];
  }

  tick_forward() {
    if (!this.alive) return;
    this.tick++;
    this.resources.energy = Math.max(0, this.resources.energy - Math.random() * 10 + 5);
    this.resources.matter = Math.max(0, this.resources.matter - Math.random() * 5 + 2);
    this.resources.information += Math.random() * 3;
    if (Math.random() < 0.05) {
      const event = this._randomEvent();
      this.history.unshift(event);
      if (this.history.length > 50) this.history.pop();
    }
  }

  _randomEvent() {
    const events = [
      'New species emerged in the biome',
      'Tectonic shift altered the landscape',
      'Celestial body passed nearby',
      'AI-driven mutation detected',
      'Resources redistribution event',
      'Ecosystem collapse in subsector',
      'Cultural renaissance among inhabitants',
    ];
    return `[Tick ${this.tick}] ${events[Math.floor(Math.random() * events.length)]}`;
  }

  destroy() {
    this.alive = false;
    this.destroyedAt = Date.now();
    this.history.unshift(`[Tick ${this.tick}] World "${this.name}" was destroyed`);
  }

  toJSON() {
    return {
      id: this.id,
      heroId: this.heroId,
      name: this.name,
      type: this.type,
      scale: this.scale,
      biomes: this.biomes,
      population: this.population,
      resources: this.resources,
      tick: this.tick,
      alive: this.alive,
      createdAt: this.createdAt,
      destroyedAt: this.destroyedAt,
      historyCount: this.history.length,
      recentHistory: this.history.slice(0, 5),
      civilizationSeed: this.civilizationSeed,
      foundingRefuge: this.foundingRefuge,
      community: this.community,
      heroes: this.heroes,
      memoryEntries: this.memoryEntries,
      historicalRecords: this.historicalRecords,
      territory: this.territory,
      future3dHooks: this.future3dHooks,
      simulationRefugeIndex: this.simulationRefugeIndex ?? null,
    };
  }
}

export class HeroRefuge {
  constructor(params = {}) {
    this.id = params.id ?? `hero-${randomUUID()}`;
    this.playerId = params.playerId ?? null;
    this.name = params.name ?? 'The Hero';
    this.title = params.title ?? 'Architect of Worlds';
    this.activeMode = params.activeMode ?? 'refugio';
    this.modes = HERO_MODES;
    this.agent = new PersonalAgent(this.id, this.name);
    this.worlds = [];
    this.maxWorlds = 256;
    this.createdAt = params.createdAt ?? Date.now();
    this.stats = params.stats ?? {
      worldsCreated: 0,
      worldsDestroyed: 0,
      totalTicks: 0,
    };
    this._dirty = false;
    this._saveTimer = null;

    if (params.companion) {
      this.agent.id = params.companion.id ?? this.agent.id;
      this.agent.name = params.companion.name ?? this.agent.name;
      if (params.companion.traits) this.agent.traits = params.companion.traits;
      this.agent.interactions = params.companion.interactions ?? 0;
    }

    this.agent.switchMode(this.activeMode);
  }

  /**
   * Load a hero from SQLite by playerId, or create a new one if not found.
   */
  static loadOrCreate(playerId, params = {}) {
    ensurePlayer(playerId, params.name);
    const row = getHeroByPlayer(playerId);

    if (row) {
      const hero = new HeroRefuge({
        id: row.id,
        playerId,
        name: row.name,
        title: row.title,
        activeMode: row.active_mode,
        companion: {
          id: row.companion_id,
          name: row.companion_name,
          traits: row.companion_traits ? JSON.parse(row.companion_traits) : undefined,
          interactions: row.companion_interactions,
        },
        stats: {
          worldsCreated: row.stats_worlds_created,
          worldsDestroyed: row.stats_worlds_destroyed,
          totalTicks: row.stats_total_ticks,
        },
      });

      const worldRows = getWorldsByHero(row.id);
      for (const wr of worldRows) {
        const w = new ArtificialWorld(hero.id, {
          name: wr.name,
          type: wr.type,
          scale: wr.scale,
          biomes: wr.biomes,
          civilizationSeed: wr.metadata?.civilizationSeed,
          foundingRefuge: wr.metadata?.foundingRefuge,
          community: wr.metadata?.community,
          heroes: wr.metadata?.heroes,
          memoryEntries: wr.metadata?.memoryEntries,
          historicalRecords: wr.metadata?.historicalRecords,
          territory: wr.metadata?.territory,
          future3dHooks: wr.metadata?.future3dHooks,
        });
        w.id = wr.id;
        w.population = wr.population;
        w.resources = wr.resources;
        w.tick = wr.tick;
        w.alive = wr.alive;
        w.history = wr.history;
        w.simulationRefugeIndex = wr.metadata?.simulationRefugeIndex ?? null;
        w.createdAt = new Date(wr.created_at).getTime();
        w.destroyedAt = wr.destroyed_at ? new Date(wr.destroyed_at).getTime() : null;
        hero.worlds.push(w);
      }

      return hero;
    }

    const hero = new HeroRefuge({ playerId, ...params });
    hero.persist();
    return hero;
  }

  persist() {
    if (!this.playerId) return;
    saveHeroState(this);
  }

  _markDirty() {
    this._dirty = true;
    if (!this._saveTimer) {
      this._saveTimer = setTimeout(() => {
        this._saveTimer = null;
        if (this._dirty) {
          this._dirty = false;
          this.persist();
        }
      }, 2000);
    }
  }

  switchMode(modeId) {
    const mode = this.modes.find((m) => m.id === modeId);
    if (!mode) return false;
    this.activeMode = modeId;
    this.agent.switchMode(modeId);
    this._markDirty();
    return true;
  }

  createWorld(params = {}) {
    if (this.worlds.filter((w) => w.alive).length >= this.maxWorlds) return null;
    const world = new ArtificialWorld(this.id, {
      scale: this.activeMode,
      heroName: this.name,
      ...params,
    });
    this.worlds.push(world);
    this.stats.worldsCreated++;
    this.agent._remember(`Created world "${world.name}" with seed ${world.civilizationSeed.label}`);

    try {
      const simWorld = getWorld();
      const refuge = simWorld.createRefuge({
        name: world.refugeName,
        ownerId: this.playerId,
      });
      if (refuge) {
        world.simulationRefugeIndex = refuge.plotIndex;
      }
    } catch { /* simulation not ready */ }

    this._markDirty();
    return world;
  }

  destroyWorld(worldId) {
    const world = this.worlds.find((w) => w.id === worldId && w.alive);
    if (!world) return false;
    world.destroy();
    this.stats.worldsDestroyed++;
    this.agent._remember(`Destroyed world "${world.name}"`);
    this._markDirty();
    return true;
  }

  getAliveWorlds() {
    return this.worlds.filter((w) => w.alive);
  }

  tickAllWorlds() {
    for (const w of this.worlds) {
      if (w.alive) w.tick_forward();
    }
    this.stats.totalTicks++;
    if (this.stats.totalTicks % 10 === 0) {
      this._markDirty();
    }
  }

  _executeTool(tool, params) {
    const alive = this.getAliveWorlds();
    switch (tool) {
      case 'createWorld': {
        const world = this.createWorld({
          name: params?.name ?? `World-${Date.now()}`,
          biomes: Array.isArray(params?.biomes) ? params.biomes : ['forest', 'plains'],
          type: params?.type ?? 'standard',
        });
        return world ? { created: world.name, id: world.id } : { error: 'Límite de mundos alcanzado' };
      }
      case 'destroyWorld': {
        const worldId = params?.worldId ?? params?.id;
        if (!worldId) return { error: 'worldId requerido' };
        const ok = this.destroyWorld(worldId);
        return ok ? { destroyed: worldId } : { error: 'Mundo no encontrado o ya destruido' };
      }
      case 'switchMode': {
        const modeId = params?.modeId ?? params?.mode;
        if (!modeId) return { error: 'modeId requerido' };
        const ok = this.switchMode(modeId);
        return ok ? { switched: modeId } : { error: `Modo "${modeId}" no existe` };
      }
      case 'listWorlds':
        return {
          count: alive.length,
          worlds: alive.map((w) => ({ id: w.id, name: w.name, tick: w.tick })),
        };
      default:
        return { error: `Herramienta desconocida: ${tool}` };
    }
  }

  async queryAgent(query, context = {}) {
    const aliveWorlds = this.getAliveWorlds();

    let simSnapshot = {};
    try {
      const simWorld = getWorld();
      const simRefuge = simWorld.getActiveRefuge();
      simSnapshot = {
        simTick: simWorld.tick,
        simRunning: simWorld.running,
        simAgents: simRefuge?.agents?.filter(a => !a.dead).length ?? 0,
        simRefuges: simWorld.refuges.length,
      };
    } catch { /* noop */ }

    const enrichedContext = {
      ...context,
      ...simSnapshot,
      worldCount: aliveWorlds.length,
    };
    const executeTool = (tool, params) => Promise.resolve(this._executeTool(tool, params));
    return this.agent.respond(query, enrichedContext, {
      executeTool,
      aliveWorlds: aliveWorlds.map((w) => ({ id: w.id, name: w.name })),
    });
  }

  toJSON() {
    let simulation = null;
    try {
      const simWorld = getWorld();
      const simRefuge = simWorld.getActiveRefuge();
      simulation = {
        tick: simWorld.tick,
        running: simWorld.running,
        agentCount: simRefuge?.agents?.filter(a => !a.dead).length ?? 0,
        refugeCount: simWorld.refuges.length,
      };
    } catch { /* noop */ }

    return {
      id: this.id,
      playerId: this.playerId,
      name: this.name,
      title: this.title,
      activeMode: this.activeMode,
      modes: this.modes,
      agent: this.agent.toJSON(),
      companion: this.agent.toJSON(),
      aliveWorlds: this.getAliveWorlds().map((w) => w.toJSON()),
      totalWorlds: this.worlds.length,
      stats: this.stats,
      simulation,
      createdAt: this.createdAt,
      civilizationSeeds: listCivilizationSeeds(),
    };
  }
}

export { HERO_MODES };
