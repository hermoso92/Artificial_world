import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneticAssemblerPanel } from './GeneticAssemblerPanel';

describe('GeneticAssemblerPanel', () => {
  it('renders species name input', () => {
    render(<GeneticAssemblerPanel blueprints={[]} />);
    expect(screen.getByPlaceholderText('New Species')).toBeInTheDocument();
  });

  it('renders Create Blueprint button', () => {
    render(<GeneticAssemblerPanel blueprints={[]} />);
    expect(screen.getByRole('button', { name: /Create Blueprint/i })).toBeInTheDocument();
  });

  it('calls onCreateBlueprint when Create is clicked', () => {
    const onCreate = vi.fn();
    render(<GeneticAssemblerPanel blueprints={[]} onCreateBlueprint={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: /Create Blueprint/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('shows Release section when blueprints exist', () => {
    const blueprints = [{ id: 1, name: 'Herbivore' }];
    render(<GeneticAssemblerPanel blueprints={blueprints} />);
    expect(screen.getByText(/Release into Refuge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Release/i })).toBeInTheDocument();
  });

  it('shows Empezar rápido when agentCount is 0 and onQuickStart provided', () => {
    const onQuickStart = vi.fn();
    render(<GeneticAssemblerPanel blueprints={[]} onQuickStart={onQuickStart} agentCount={0} />);
    const btn = screen.getByRole('button', { name: /Empezar rápido/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onQuickStart).toHaveBeenCalled();
  });

  it('hides Empezar rápido when agentCount > 0', () => {
    render(<GeneticAssemblerPanel blueprints={[]} onQuickStart={vi.fn()} agentCount={5} />);
    expect(screen.queryByRole('button', { name: /Empezar rápido/i })).not.toBeInTheDocument();
  });
});
