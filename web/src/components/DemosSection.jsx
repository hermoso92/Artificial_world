
import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DemosSection = () => {
  const navigate = useNavigate();
  
  const demos = [
    {
      title: 'Artificial World',
      subtitle: 'Simulación viva',
      desc: 'Visualizador 2D en tiempo real del motor de simulación. Observa a los agentes tomar decisiones basadas en su función de utilidad.',
      icon: <Play className="w-6 h-6" />,
      path: '/demos'
    }
  ];

  return (
    <section className="py-24 bg-elevated relative border-y border-border" id="demos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            Demos Interactivas
          </h2>
          <p className="text-xl text-secondary">
            Interactúa con los sistemas en tiempo real.
          </p>
        </div>

        <div className="grid md:grid-cols-1 max-w-2xl mx-auto gap-6">
          {demos.map((demo, i) => (
            <div 
              key={i}
              onClick={() => navigate(demo.path)}
              className="glass p-8 rounded-2xl transition-all duration-500 group cursor-pointer hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                  {demo.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{demo.title}</h3>
                  <p className="text-primary text-sm font-mono mb-3">{demo.subtitle}</p>
                  <p className="text-secondary leading-relaxed">{demo.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DemosSection;
