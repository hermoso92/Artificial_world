
import React from 'react';
import { Globe, Briefcase, Flame, Gamepad2, BookOpen } from 'lucide-react';

const EcosistemaSection = () => {
  const surfaces = [
    {
      title: "Simulación Principal / Constructor de Mundos",
      description: "El núcleo del proyecto. Un entorno 2D determinista donde agentes autónomos toman decisiones basadas en funciones de utilidad. Incluye 13 acciones posibles, 7 semillas de civilización y es completamente reproducible (sesión canónica con seed 42).",
      icon: Globe,
      highlight: true
    },
    {
      title: "DobackSoft",
      description: "Una demostración vertical temática integrada en el ecosistema. Conecta directamente con FireSimulator para mostrar aplicaciones prácticas de la simulación en entornos controlados.",
      icon: Briefcase,
      highlight: false
    },
    {
      title: "FireSimulator",
      description: "Superficie temática y demostración interactiva enfocada en el entrenamiento y la visualización de propagación en entornos 2D.",
      icon: Flame,
      highlight: false
    },
    {
      title: "Arena de Minijuegos",
      description: "Entornos de prueba para lógica determinista y toma de decisiones. Incluye implementaciones completas de Tic Tac Toe y Checkers, con Chess planificado en el roadmap.",
      icon: Gamepad2,
      highlight: false
    },
    {
      title: "Mystic Quest",
      description: "Superficie narrativa que explora la experiencia de historia dentro del ecosistema, demostrando la flexibilidad del motor para soportar diferentes tipos de interacciones.",
      icon: BookOpen,
      highlight: false
    }
  ];

  return (
    <section className="py-16 w-full bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-6">
            Ecosistema de Superficies
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            Artificial World se compone de múltiples superficies interconectadas, cada una diseñada para demostrar capacidades específicas del motor determinista.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surfaces.map((surface, idx) => {
            const Icon = surface.icon;
            return (
              <div 
                key={idx} 
                className={`bg-slate-900 rounded-xl p-8 border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                  surface.highlight ? 'border-accent-amber/50 md:col-span-2 lg:col-span-3' : 'border-slate-700'
                }`}
                aria-label={`Tarjeta de ecosistema: ${surface.title}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    surface.highlight ? 'bg-accent-amber/20' : 'bg-slate-800'
                  }`}>
                    <Icon className={`w-6 h-6 ${surface.highlight ? 'text-accent-amber' : 'text-slate-400'}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{surface.title}</h3>
                </div>
                <p className="text-slate-300 leading-relaxed flex-grow">
                  {surface.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default EcosistemaSection;
