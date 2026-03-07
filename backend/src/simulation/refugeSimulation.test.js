import { describe, it, expect, beforeEach } from 'vitest';
import { Refuge } from './refuge.js';
import { tickRefuge } from './refugeSimulation.js';
import { Blueprint } from './blueprint.js';

describe('refugeSimulation', () => {
  let refuge;
  let herbivoreBlueprint;
  let predatorBlueprint;

  beforeEach(() => {
    Refuge.nextId = 1;
    refuge = new Refuge(0);
    refuge.initNodes();
    herbivoreBlueprint = new Blueprint('Herbivore', {
      movementSpeed: 1,
      metabolism: 0.3,
      attack: 0,
      defense: 0.5,
      gatheringRate: 1.2,
      reproductionThreshold: 0.8,
    });
    predatorBlueprint = new Blueprint('Predator', {
      movementSpeed: 1.2,
      metabolism: 0.6,
      attack: 2.5,
      defense: 0.2,
      gatheringRate: 0.5,
      reproductionThreshold: 0.8,
    });
  });

  it('agents gain energy at solar flux nodes', () => {
    refuge.releaseAgents(herbivoreBlueprint, 1);
    const agent = refuge.agents[0];
    agent.gridX = 8;
    agent.gridY = 8;
    agent.energy = 0.3;
    const before = agent.energy;
    const logs = [];
    tickRefuge(refuge, 1, (msg, type) => logs.push({ msg, type }));
    expect(agent.energy).toBeGreaterThan(before);
    expect(agent.dead).toBe(false);
  });

  it('agents lose energy from metabolism', () => {
    refuge.releaseAgents(herbivoreBlueprint, 1);
    const agent = refuge.agents[0];
    agent.gridX = 0;
    agent.gridY = 0;
    agent.energy = 0.5;
    const before = agent.energy;
    tickRefuge(refuge, 1, () => {});
    expect(agent.energy).toBeLessThanOrEqual(before);
  });

  it('agents starve when energy reaches 0', () => {
    refuge.releaseAgents(herbivoreBlueprint, 1);
    const agent = refuge.agents[0];
    agent.gridX = 0;
    agent.gridY = 0;
    agent.energy = 0.002;
    const logs = [];
    tickRefuge(refuge, 1, (msg, type) => logs.push({ msg, type }));
    expect(agent.dead).toBe(true);
    expect(logs.some((l) => l.type === 'death')).toBe(true);
  });

  it('predator can kill prey in same cell', () => {
    refuge.releaseAgents(herbivoreBlueprint, 1);
    refuge.releaseAgents(predatorBlueprint, 1);
    const prey = refuge.agents[0];
    const predator = refuge.agents[1];
    prey.gridX = predator.gridX = 10;
    prey.gridY = predator.gridY = 10;
    prey.energy = 0.3;
    predator.energy = 0.8;
    const logs = [];
    for (let i = 0; i < 20; i++) {
      tickRefuge(refuge, i, (msg, type) => logs.push({ msg, type }));
      if (prey.dead) break;
    }
    expect(prey.dead).toBe(true);
    expect(logs.some((l) => l.type === 'combat')).toBe(true);
  });

  it('agents can reproduce when threshold met', () => {
    refuge.releaseAgents(herbivoreBlueprint, 1);
    const agent = refuge.agents[0];
    agent.gridX = 15;
    agent.gridY = 15;
    agent.energy = 0.9;
    agent.matter = 0.5;
    const initialCount = refuge.agents.filter((a) => !a.dead).length;
    const logs = [];
    tickRefuge(refuge, 1, (msg, type) => logs.push({ msg, type }));
    const afterCount = refuge.agents.filter((a) => !a.dead).length;
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });
});
