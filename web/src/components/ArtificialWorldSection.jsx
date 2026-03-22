
import React from 'react';
import { Brain, Activity, ShieldAlert, Github, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArtificialWorldSection = () => {
  return (
    <section className="py-32 bg-elevated relative border-y border-border" id="artificial-world">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Panel */}
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6">
              Arquitectura Determinista
            </h2>
            <p className="text-xl text-primary font-bold mb-6">
              U(a, i, t) = w_h * H(i, t) + w_e * E(i, t) + w_s * S(a, i)
            </p>
            <div className="space-y-6 text-secondary text-lg leading-relaxed mb-8">
              <p>
                Artificial World es un motor de simulación escrito en Python donde los agentes toman decisiones evaluando matemáticamente su entorno. No hay rutinas de "agrupación" preprogramadas ni llamadas a APIs externas.
              </p>
              <p>
                Cada agente calcula el valor esperado de sus acciones basándose en su estado interno (hambre, energía) y su memoria espacial. El comportamiento de "manada" y la cooperación emergen naturalmente como la solución matemática óptima para la supervivencia.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-bold"
                onClick={() => window.open('https://github.com/hermoso92/Artificial_world', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" /> Ver Código Fuente
              </Button>
            </div>
          </div>

          {/* Right Panel - Features */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary hover:bg-card/80 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Terminal className="text-primary w-6 h-6" />
                <h3 className="text-xl font-bold text-foreground">Reproducibilidad Exacta</h3>
              </div>
              <p className="text-secondary">
                Al estar basado en semillas criptográficas (ej. Seed 42), cada simulación puede ser replicada con exactitud frame a frame. Mismos inputs, mismos resultados.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary hover:bg-card/80 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="text-primary w-6 h-6" />
                <h3 className="text-xl font-bold text-foreground">Función de Utilidad</h3>
              </div>
              <p className="text-secondary">
                Los agentes evalúan múltiples acciones posibles en cada tick y seleccionan la que maximiza su utilidad, equilibrando exploración, recolección y seguimiento.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary hover:bg-card/80 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="text-primary w-6 h-6" />
                <h3 className="text-xl font-bold text-foreground">Comportamiento Emergente</h3>
              </div>
              <p className="text-secondary">
                Estrategias complejas surgen de reglas simples. En simulaciones canónicas, la acción "SEGUIR" domina naturalmente cuando los recursos escasean.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ArtificialWorldSection;
