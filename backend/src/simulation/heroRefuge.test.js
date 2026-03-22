/**
 * HeroRefuge tests — agent, tools, mock fallback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeroRefuge } from './heroRefuge.js';
import * as llmService from '../services/llmService.mjs';

vi.mock('../services/llmService.mjs', () => ({
  generateAnswer: vi.fn(),
  generateToolResultAnswer: vi.fn(),
}));

describe('HeroRefuge', () => {
  let hero;

  beforeEach(() => {
    hero = new HeroRefuge({ name: 'TestHero', title: 'Tester' });
    vi.clearAllMocks();
  });

  it('creates hero with agent and modes', () => {
    expect(hero.name).toBe('TestHero');
    expect(hero.title).toBe('Tester');
    expect(hero.agent).toBeDefined();
    expect(hero.agent.name).toContain('TestHero');
    expect(hero.modes).toHaveLength(13);
    expect(hero.activeMode).toBe('refugio');
  });

  it('queryAgent returns mock answer when Ollama unavailable', async () => {
    vi.mocked(llmService.generateAnswer).mockResolvedValue({
      type: 'answer',
      text: 'Respuesta mock de prueba',
    });

    const resp = await hero.queryAgent('Hola', {});
    expect(resp.answer).toBe('Respuesta mock de prueba');
    expect(llmService.generateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'Hola',
        heroName: 'TestHero',
      })
    );
  });

  it('queryAgent executes createWorld tool when LLM returns toolCall', async () => {
    vi.mocked(llmService.generateAnswer).mockResolvedValue({
      type: 'toolCall',
      tool: 'createWorld',
      params: { name: 'Eden', biomes: ['forest', 'plains'] },
    });
    vi.mocked(llmService.generateToolResultAnswer).mockResolvedValue('He creado el mundo Eden.');

    const resp = await hero.queryAgent('Crea un mundo llamado Eden');
    expect(resp.answer).toBe('He creado el mundo Eden.');
    expect(hero.getAliveWorlds()).toHaveLength(1);
    expect(hero.getAliveWorlds()[0].name).toBe('Eden');
  });

  it('_executeTool createWorld creates world with params', () => {
    const result = hero._executeTool('createWorld', {
      name: 'Paradise',
      biomes: ['desert', 'ocean'],
    });
    expect(result.created).toBe('Paradise');
    expect(hero.getAliveWorlds()[0].biomes).toEqual(['desert', 'ocean']);
  });

  it('createWorld attaches civilization seed, refuge and community foundation', () => {
    const world = hero.createWorld({
      name: 'Citadel',
      civilizationSeedId: 'merchant-city',
      refugeName: 'Puerto fundador',
    });

    expect(world.civilizationSeed.label).toBe('Ciudad comerciante');
    expect(world.foundingRefuge.name).toBe('Puerto fundador');
    expect(world.community.name).toBe('Liga Mercante');
    expect(world.heroes[0].name).toBe('TestHero');
    expect(world.recentHistory ?? world.history).toBeDefined();
  });

  it('_executeTool switchMode changes mode', () => {
    const result = hero._executeTool('switchMode', { modeId: 'galaxia' });
    expect(result.switched).toBe('galaxia');
    expect(hero.activeMode).toBe('galaxia');
  });

  it('_executeTool listWorlds returns worlds', () => {
    hero.createWorld({ name: 'A' });
    hero.createWorld({ name: 'B' });
    const result = hero._executeTool('listWorlds', {});
    expect(result.count).toBe(2);
    expect(result.worlds).toHaveLength(2);
  });

  it('_executeTool destroyWorld destroys world', () => {
    const world = hero.createWorld({ name: 'ToDestroy' });
    const result = hero._executeTool('destroyWorld', { worldId: world.id });
    expect(result.destroyed).toBe(world.id);
    expect(hero.getAliveWorlds()).toHaveLength(0);
  });
});
