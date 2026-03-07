import { describe, it, expect, beforeEach } from 'vitest';
import { Agent } from './agent.js';

describe('Agent', () => {
  beforeEach(() => {
    Agent.nextId = 1;
  });

  it('creates agent with default traits', () => {
    const blueprint = { id: 1, traits: { movementSpeed: 1, metabolism: 0.5, attack: 0, defense: 0, gatheringRate: 1, reproductionThreshold: 0.8 } };
    const agent = new Agent(5, 5, blueprint);
    expect(agent.id).toBe(1);
    expect(agent.gridX).toBe(5);
    expect(agent.gridY).toBe(5);
    expect(agent.movementSpeed).toBe(1);
    expect(agent.metabolism).toBe(0.5);
    expect(agent.attack).toBe(0);
    expect(agent.dead).toBe(false);
  });

  it('canReproduce returns true when energy and matter above threshold', () => {
    const blueprint = { id: 1, traits: { reproductionThreshold: 0.8 } };
    const agent = new Agent(0, 0, blueprint);
    agent.energy = 0.9;
    agent.matter = 0.5;
    expect(agent.canReproduce).toBe(true);
  });

  it('canReproduce returns false when energy low', () => {
    const blueprint = { id: 1, traits: { reproductionThreshold: 0.8 } };
    const agent = new Agent(0, 0, blueprint);
    agent.energy = 0.5;
    agent.matter = 0.5;
    expect(agent.canReproduce).toBe(false);
  });

  it('toJSON serializes correctly', () => {
    const blueprint = { id: 1, traits: { attack: 1, defense: 0.5 } };
    const agent = new Agent(10, 10, blueprint);
    const json = agent.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('gridX', 10);
    expect(json).toHaveProperty('gridY', 10);
    expect(json).toHaveProperty('traits');
    expect(json.traits.attack).toBe(1);
    expect(json).toHaveProperty('energy');
    expect(json).toHaveProperty('dead', false);
  });
});
