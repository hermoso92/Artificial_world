import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationView } from './SimulationView';
import { api } from '../services/api';

vi.mock('../hooks/useRealtimeSimulation', () => ({
  useRealtimeSimulation: () => ({
    connected: false,
    refuge: null,
    tick: 0,
    running: false,
    agentCount: 0,
  }),
}));

vi.mock('../hooks/useSimulationData', () => ({
  useSimulationData: vi.fn(),
}));

vi.mock('./SimulationCanvas', () => ({ SimulationCanvas: () => <div data-testid="simulation-canvas" /> }));
vi.mock('./HeroRefugePanel', () => ({ HeroRefugePanel: () => <div data-testid="hero-refuge-panel" /> }));
vi.mock('./DetectionBanner', () => ({ DetectionBanner: () => null }));

import { useSimulationData } from '../hooks/useSimulationData';

const mockWorld = {
  tick: 0,
  running: false,
  activeRefugeIndex: 0,
  refuge: { id: 1, name: 'Refugio 1', agents: [], ownerId: null, plotIndex: 0, agentCount: 0, maxAgents: 50, solarNodes: [], mineralNodes: [] },
};

describe('SimulationView', () => {
  beforeEach(() => {
    vi.mocked(api.checkHealth).mockResolvedValue({});
    vi.mocked(api.getWorld).mockResolvedValue(mockWorld);
    vi.mocked(api.getAgents).mockResolvedValue([]);
    vi.mocked(api.getBlueprints).mockResolvedValue([{ id: 1, name: 'Test' }]);
    vi.mocked(api.getLogs).mockResolvedValue([]);
    vi.mocked(api.getRefuges).mockResolvedValue([{ id: 1, name: 'Refugio 1', ownerId: null }]);
    vi.mocked(api.getHero).mockResolvedValue(null);
  });

  it('renders loading state when initialLoad is true', () => {
    vi.mocked(useSimulationData).mockReturnValue({
      world: null,
      agents: [],
      blueprints: [],
      logs: [],
      refuges: [],
      hero: null,
      setHero: vi.fn(),
      activeRefugeIndex: 0,
      setActiveRefugeIndex: vi.fn(),
      initialLoad: true,
      error: null,
      setError: vi.fn(),
      setInitialLoad: vi.fn(),
      fetchData: vi.fn(),
    });
    render(<SimulationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/Entrando en tu mundo/i)).toBeInTheDocument();
  });

  it('renders main content when data is loaded', () => {
    vi.mocked(useSimulationData).mockReturnValue({
      world: mockWorld,
      agents: [],
      blueprints: [{ id: 1, name: 'Test' }],
      logs: [],
      refuges: [{ id: 1, name: 'Refugio 1', ownerId: null }],
      hero: null,
      setHero: vi.fn(),
      activeRefugeIndex: 0,
      setActiveRefugeIndex: vi.fn(),
      initialLoad: false,
      error: null,
      setError: vi.fn(),
      setInitialLoad: vi.fn(),
      fetchData: vi.fn(),
    });
    render(<SimulationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /Hub/i })).toBeInTheDocument();
  });
});
