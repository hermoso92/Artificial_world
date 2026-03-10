
import React from 'react';
import { Brain, Network, Zap, Target, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatIsArtificialWorld = () => {
  const scrollToSimulator = () => {
    const el = document.getElementById('simulator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: Brain,
      title: "Autonomous Agents",
      description: "Agents make independent decisions using utility functions, balancing their own needs with the environment."
    },
    {
      icon: Network,
      title: "Emergent Behavior",
      description: "Complex societal patterns, cooperation, and conflicts arise naturally from simple individual rules."
    },
    {
      icon: Target,
      title: "13 Distinct Actions",
      description: "From moving and gathering energy to cooperating, defecting, or reproducing, agents have a rich action space."
    },
    {
      icon: Zap,
      title: "7 Civilization Seeds",
      description: "Explore different starting conditions—from aggressive to cooperative—and watch how societies evolve."
    }
  ];

  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-8">
            What is Artificial World?
          </h2>
          
          <div className="space-y-6 text-lg md:text-xl text-secondary leading-relaxed text-left bg-card p-8 rounded-2xl border border-border shadow-lg">
            <p>
              <strong className="text-foreground">Artificial World</strong> is a deterministic simulation system that models how autonomous agents make decisions and interact within a shared environment. Think of it as a digital petri dish where simple rules give rise to complex, unpredictable societies.
            </p>
            <p>
              <strong>How it works:</strong> Instead of following pre-programmed scripts, each agent uses a mathematical <em>utility function</em> to evaluate its surroundings. They constantly weigh their options—should I gather energy, cooperate with my neighbor, or attack them?—to maximize their own survival and success.
            </p>
            <p>
              <strong>Why it matters:</strong> By observing these digital entities, we can study how order, complexity, and societal structures emerge from chaos. It provides a fascinating, reproducible lens (using seed 42) into economics, sociology, and evolutionary biology, demonstrating how individual selfishness or cooperation shapes the fate of an entire civilization.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="bg-card rounded-xl p-6 border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all duration-300"
            onClick={() => window.open('https://smallpdf.com/es/file#s=4fc8b09d-e830-4a1c-8b86-959d26078322', '_blank')}
          >
            <FileText className="w-5 h-5 mr-2" /> Read the Full Paper
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground h-14 px-8 text-lg font-bold transition-all duration-300"
            onClick={scrollToSimulator}
          >
            <Play className="w-5 h-5 mr-2" /> See it in Action
          </Button>
        </div>

      </div>
    </section>
  );
};

export default WhatIsArtificialWorld;
