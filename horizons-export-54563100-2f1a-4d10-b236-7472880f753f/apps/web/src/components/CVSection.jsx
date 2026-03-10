
import React from 'react';
import { motion } from 'framer-motion';

const CVSection = () => {
  const stack = [
    { category: 'Lenguajes', items: ['Python', 'JavaScript'] },
    { category: 'Conceptos', items: ['Sistemas Multi-Agente', 'Funciones de Utilidad', 'Sistemas Deterministas'] },
    { category: 'Herramientas', items: ['Git', 'GitHub'] },
  ];

  return (
    <section className="py-24 bg-background relative" id="cv">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            Desarrollador & Investigador
          </h2>
          <p className="text-xl text-secondary">
            Enfoque en sistemas autónomos y comportamiento emergente.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="glass p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-foreground mb-8">Áreas de Especialización</h3>
            <div className="space-y-6">
              {stack.map((group, i) => (
                <div key={i}>
                  <h4 className="text-primary font-mono text-sm mb-3">{group.category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, j) => (
                      <span key={j} className="px-3 py-1.5 bg-elevated border border-border rounded-md text-sm text-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVSection;
