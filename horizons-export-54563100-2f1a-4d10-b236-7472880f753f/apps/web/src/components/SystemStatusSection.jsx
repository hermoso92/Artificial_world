import React from 'react';
import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react';

const STATUS_GROUPS = [
  {
    title: 'Implementado aquí',
    icon: CheckCircle2,
    tone: 'text-success',
    items: [
      'Landing pública y Hub navegable',
      'Arena con 3 en Raya y Damas',
      'Paper web, repositorio y base PWA',
    ],
  },
  {
    title: 'Visible como demo',
    icon: PlayCircle,
    tone: 'text-primary',
    items: [
      'FireSimulator como demo de propagación 2D',
      'DobackSoft como vertical demo conectada',
      'Simulación visible como capa ilustrativa parcial',
    ],
  },
  {
    title: 'Fuera de esta build',
    icon: Clock3,
    tone: 'text-warning',
    items: [
      'Motor principal verificable del proyecto',
      'Mission Control y Hero Refuge',
      'Integraciones completas y validación experimental dura',
    ],
  },
];

const SystemStatusSection = () => {
  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6">
            Estado del sistema
          </h2>
          <p className="text-xl text-secondary leading-relaxed">
            Esta página distingue entre lo implementado aquí, lo visible como demo y lo que debe contrastarse fuera de esta build pública.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STATUS_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="bg-card rounded-2xl border border-border p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                  <Icon className={`w-6 h-6 ${group.tone}`} aria-hidden="true" />
                  <h3 className="text-xl font-bold text-foreground">{group.title}</h3>
                </div>
                <ul className="space-y-3 text-secondary">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={`mt-2 h-1.5 w-1.5 rounded-full ${group.tone === 'text-success' ? 'bg-success' : group.tone === 'text-primary' ? 'bg-primary' : 'bg-warning'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SystemStatusSection;
