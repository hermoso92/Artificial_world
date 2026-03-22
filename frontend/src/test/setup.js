import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

vi.mock('../services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    getWorld: vi.fn(),
    getAgents: vi.fn(),
    getBlueprints: vi.fn(),
    getLogs: vi.fn(),
    getRefuges: vi.fn(),
    getHero: vi.fn(),
    createRefuge: vi.fn(),
    createBlueprint: vi.fn(),
    releaseAgents: vi.fn(),
    selectRefuge: vi.fn(),
    startSimulation: vi.fn(),
    pauseSimulation: vi.fn(),
    resetSimulation: vi.fn(),
  },
  getPlayerId: vi.fn(() => 'player_test'),
}));
