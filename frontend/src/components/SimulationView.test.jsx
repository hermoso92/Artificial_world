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

vi.mock('./SimulationCanvas', () => ({ SimulationCanvas: () => <div data-testid="simulation-canvas" /> }));
vi.mock('./HeroRefugePanel', () => ({ HeroRefugePanel: () => <div data-testid="hero-refuge-panel" /> }));
vi.mock('./DetectionBanner', () => ({ DetectionBanner: () => null }));

describe('SimulationView', () => {
  beforeEach(() => {
    vi.mocked(api.checkHealth).mockResolvedValue({});
    vi.mocked(api.getWorld).mockResolvedValue({
      tick: 0,
      running: false,
      activeRefugeIndex: 0,
      refuge: { id: 1, name: 'Refugio 1', agents: [], ownerId: null },
    });
    vi.mocked(api.getAgents).mockResolvedValue([]);
    vi.mocked(api.getBlueprints).mockResolvedValue([{ id: 1, name: 'Test' }]);
    vi.mocked(api.getLogs).mockResolvedValue([]);
    vi.mocked(api.getRefuges).mockResolvedValue([{ id: 1, name: 'Refugio 1', ownerId: null }]);
    vi.mocked(api.getHero).mockResolvedValue(null);
  });

  it('renders loading state initially', () => {
    render(<SimulationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/Entrando en tu mundo/i)).toBeInTheDocument();
  });

  it('renders main content after data loads', async () => {
    const { findByRole } = render(<SimulationView onBack={() => {}} onNavigate={() => {}} />);
    const hubBtn = await findByRole('button', { name: /Hub/i }, { timeout: 5000 });
    expect(hubBtn).toBeInTheDocument();
  });
});
