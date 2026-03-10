
import React from 'react';
import { Brain, Cpu, Network, Zap, Shield, Target } from 'lucide-react';

const ArtificialWorldExplainer = () => {
  return (
    <section className="py-12 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Project Overview */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6">
            Project Overview
          </h2>
          <p className="text-xl text-secondary leading-relaxed">
            Agent-based simulation system modeling autonomous agents optimizing individual utility functions while interacting in a shared environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Utility Function */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Utility Function</h3>
            <p className="text-secondary mb-6">
              Agents make decisions by maximizing their individual utility based on their state and the state of others in the environment.
            </p>
            <div className="bg-background p-4 rounded-lg border border-border font-mono text-center overflow-x-auto">
              <span className="text-primary font-bold text-lg whitespace-nowrap">
                U(a,i,t) = (a_i(t) - 0.5)² + 0.5 * Σ(a_j(t))
              </span>
            </div>
            <p className="text-sm text-secondary mt-4 italic">
              Where a_i(t) is the agent's state at time t, and a_j(t) represents the states of other agents (j≠i).
            </p>
          </div>

          {/* Agent System */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Agent System</h3>
            <p className="text-secondary mb-6">
              Agents possess a discrete action space of 13 autonomous actions, allowing for complex emergent behaviors like cooperation and conflict.
            </p>
            <div className="flex flex-wrap gap-2">
              {['move_up', 'move_down', 'move_left', 'move_right', 'stay', 'increase_energy', 'decrease_energy', 'reproduce', 'die', 'attack', 'defend', 'cooperate', 'defect'].map(action => (
                <span key={action} className="px-3 py-1 bg-background border border-border rounded-full text-xs font-mono text-foreground">
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Seeds & Specs */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-elevated rounded-xl p-6 border border-border">
            <Target className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-bold text-foreground mb-2">7 Civilization Seeds</h4>
            <p className="text-sm text-secondary mb-4">Initial parameters defining distinct starting conditions.</p>
            <ul className="space-y-2 font-mono text-xs text-secondary">
              <li><span className="text-[#ff3366]">●</span> Seed_0: Baseline</li>
              <li><span className="text-[#33ccff]">●</span> Seed_1: High Energy</li>
              <li><span className="text-[#33ff99]">●</span> Seed_2: Aggressive</li>
              <li><span className="text-[#ffcc00]">●</span> Seed_3: Cooperative</li>
              <li><span className="text-[#cc33ff]">●</span> Seed_4: Nomadic</li>
              <li><span className="text-[#ff9933]">●</span> Seed_5: Defensive</li>
              <li><span className="text-[#ffffff]">●</span> Seed_6: Chaotic</li>
            </ul>
          </div>

          <div className="bg-elevated rounded-xl p-6 border border-border">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-bold text-foreground mb-2">Key Features</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                Reproducibility with seed 42
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                200-tick canonical sessions
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                Real-time metrics tracking
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                Deterministic execution
              </li>
            </ul>
          </div>

          <div className="bg-elevated rounded-xl p-6 border border-border">
            <Cpu className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-bold text-foreground mb-2">Technical Specs</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-secondary">Grid Size</span>
                <span className="font-mono text-foreground">800x450</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-secondary">Agent Count</span>
                <span className="font-mono text-foreground">50 Initial</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-secondary">Action Space</span>
                <span className="font-mono text-foreground">13 Actions</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-secondary">Tick Duration</span>
                <span className="font-mono text-foreground">Variable</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ArtificialWorldExplainer;
