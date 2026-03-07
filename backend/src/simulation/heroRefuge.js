/**
 * HeroRefuge — El refugio-origen del héroe.
 * Al crearse, genera automáticamente un Agente Personalizado (companion IA)
 * que opera en 13 modos de escala: personal → ia → galaxia.
 * Persiste mundos artificiales asociados al héroe.
 */

import { randomUUID } from 'crypto';
import { generateAnswer, generateToolResultAnswer } from '../services/llmService.mjs';

const HERO_MODES = [
  { id: 'personal',    label: 'Personal',    icon: '👤', scale: 1,   description: 'Espacio íntimo del héroe, pensamientos y objetivos propios' },
  { id: 'empresa',     label: 'Empresa',     icon: '🏢', scale: 2,   description: 'Organización, equipo y recursos productivos' },
  { id: 'comunidad',   label: 'Comunidad',   icon: '🏘️', scale: 3,   description: 'Red social local, vecinos, aliados' },
  { id: 'hogar',       label: 'Hogar',       icon: '🏠', scale: 4,   description: 'Base segura, familia, recursos vitales' },
  { id: 'cuarto',      label: 'Cuarto',      icon: '🛏️', scale: 5,   description: 'El núcleo más íntimo: descanso, ideación' },
  { id: 'refugio',     label: 'Refugio',     icon: '🛡️', scale: 6,   description: 'Refugio artificial persistente en el mundo simulado' },
  { id: 'ecosistema',  label: 'Ecosistema',  icon: '🌿', scale: 7,   description: 'Biomas, cadenas alimentarias, equilibrio vital' },
  { id: 'planeta',     label: 'Planeta',     icon: '🌍', scale: 8,   description: 'Mundo completo con clima, biomas y civilizaciones' },
  { id: 'mundo',       label: 'Mundo',       icon: '🌐', scale: 9,   description: 'Mundo artificial con historia y persistencia propia' },
  { id: 'galaxia',     label: 'Galaxia',     icon: '🌌', scale: 10,  description: 'Sistema de mundos interconectados' },
  { id: 'persistencia',label: 'Persistencia',icon: '♾️', scale: 11,  description: 'Motor de memoria a largo plazo, legado del héroe' },
  { id: 'ia',          label: 'IA',          icon: '🤖', scale: 12,  description: 'Agente autónomo con inteligencia adaptativa' },
  { id: 'nexo',        label: 'Nexo',        icon: '✨', scale: 13,  description: 'El todo: donde convergen todos los modos' },
];

class PersonalAgent {
  constructor(heroId, heroName) {
    this.id = `agent-${randomUUID()}`;
    this.heroId = heroId;
    this.heroName = heroName;
    this.name = `Companion of ${heroName}`;
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
    this.id = `world-${randomUUID()}`;
    this.heroId = heroId;
    this.name = params.name ?? `World-${Date.now()}`;
    this.type = params.type ?? 'standard';
    this.scale = params.scale ?? 'mundo';
    this.biomes = params.biomes ?? ['forest', 'plains'];
    this.population = 0;
    this.resources = { energy: 1000, matter: 500, information: 200 };
    this.tick = 0;
    this.alive = true;
    this.createdAt = Date.now();
    this.destroyedAt = null;
    this.history = [`World "${this.name}" created at tick 0`];
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
    };
  }
}

export class HeroRefuge {
  constructor(params = {}) {
    this.id = `hero-${randomUUID()}`;
    this.name = params.name ?? 'The Hero';
    this.title = params.title ?? 'Architect of Worlds';
    this.activeMode = 'refugio';
    this.modes = HERO_MODES;
    this.agent = new PersonalAgent(this.id, this.name);
    this.worlds = [];
    this.maxWorlds = 256;
    this.createdAt = Date.now();
    this.stats = {
      worldsCreated: 0,
      worldsDestroyed: 0,
      totalTicks: 0,
    };

    this.agent.switchMode('refugio');
  }

  switchMode(modeId) {
    const mode = this.modes.find((m) => m.id === modeId);
    if (!mode) return false;
    this.activeMode = modeId;
    this.agent.switchMode(modeId);
    return true;
  }

  createWorld(params = {}) {
    if (this.worlds.filter((w) => w.alive).length >= this.maxWorlds) return null;
    const world = new ArtificialWorld(this.id, {
      scale: this.activeMode,
      ...params,
    });
    this.worlds.push(world);
    this.stats.worldsCreated++;
    this.agent._remember(`Created world "${world.name}" (${world.scale})`);
    return world;
  }

  destroyWorld(worldId) {
    const world = this.worlds.find((w) => w.id === worldId && w.alive);
    if (!world) return false;
    world.destroy();
    this.stats.worldsDestroyed++;
    this.agent._remember(`Destroyed world "${world.name}"`);
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
    const enrichedContext = {
      ...context,
      worldCount: aliveWorlds.length,
    };
    const executeTool = (tool, params) => Promise.resolve(this._executeTool(tool, params));
    return this.agent.respond(query, enrichedContext, {
      executeTool,
      aliveWorlds: aliveWorlds.map((w) => ({ id: w.id, name: w.name })),
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      activeMode: this.activeMode,
      modes: this.modes,
      agent: this.agent.toJSON(),
      aliveWorlds: this.getAliveWorlds().map((w) => w.toJSON()),
      totalWorlds: this.worlds.length,
      stats: this.stats,
      createdAt: this.createdAt,
    };
  }
}

export { HERO_MODES };
