import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pauseSimulation, startSimulation, resetSimulation } from './engine.js';
import { getWorld, resetWorld } from './worldManager.js';

describe('engine', () => {
  beforeEach(() => {
    resetWorld();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetWorld();
  });

  it('pauseSimulation stops tick progression', () => {
    const world = getWorld();

    startSimulation();
    vi.advanceTimersByTime(1100);
    const tickAfterStart = world.tick;

    pauseSimulation();
    vi.advanceTimersByTime(2200);

    expect(world.running).toBe(false);
    expect(world.tick).toBe(tickAfterStart);
  });

  it('startSimulation advances tick over time', () => {
    const world = getWorld();
    const initialTick = world.tick;

    startSimulation();
    expect(world.running).toBe(true);

    vi.advanceTimersByTime(2500);
    expect(world.tick).toBeGreaterThan(initialTick);

    pauseSimulation();
  });

  it('resetSimulation clears world state', () => {
    const world = getWorld();
    startSimulation();
    vi.advanceTimersByTime(3100);
    const tickBeforeReset = world.tick;
    expect(tickBeforeReset).toBeGreaterThan(0);

    resetSimulation();
    const worldAfter = getWorld();
    expect(worldAfter.tick).toBe(0);
    expect(worldAfter.running).toBe(false);
  });
});
