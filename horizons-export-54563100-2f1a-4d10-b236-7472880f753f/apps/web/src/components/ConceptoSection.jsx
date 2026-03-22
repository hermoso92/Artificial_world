
import React from 'react';
import { Brain, Network, Zap, Target } from 'lucide-react';

const ConceptoSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Autonomous Agents",
      description: "Agents evaluate their environment and make independent decisions strictly based on mathematical utility functions."
    },
    {
      icon: Target,
      title: "13 Discrete Actions",
      description: "A well-defined action space including movement, energy gathering, cooperation, defection, and reproduction."
    },
    {
      icon: Zap,
      title: "7 Civilization Seeds",
      description: "Pre-configured initial states that dictate the starting parameters and behavioral tendencies of the population."
    },
    {
      icon: Network,
      title: "Estado verificable",
      description: "Esta build pública expone interfaces y demos revisables. El motor determinista completo y su verificación viven en el repositorio principal."
    }
  ];

  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-8">
            Concepto Técnico
          </h2>
          
          <div className="space-y-6 text-lg text-secondary leading-relaxed text-left bg-card p-8 rounded-2xl border border-border shadow-lg">
            <p>
              <strong className="text-foreground">Artificial World</strong> se presenta aquí como una entrada pública al ecosistema: una web navegable con Hub, paper, repositorio y varias superficies visibles.
            </p>
            <p>
              Lo que sí se puede defender desde esta build es la existencia de una visualización 2D, un espacio de 13 acciones, 9 semillas configurables y varias superficies del ecosistema. Lo que no se puede vender aquí como plenamente operativo se marca como demo, parcial o roadmap.
            </p>
            <p>
              La lógica completa del proyecto, incluyendo el motor principal y otras integraciones fuera de esta web, debe verificarse en el repositorio y en las superficies que estén realmente accesibles.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="bg-card rounded-xl p-6 border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                aria-label={`Característica: ${feature.title}`}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ConceptoSection;
