
import React from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import ArtificialWorldSimulator from '@/components/ArtificialWorldSimulator.jsx';

const SimulationPage = () => {
  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-950 min-h-screen">
      <Helmet>
        <title>Constructor de Mundos | Artificial World</title>
        <meta name="description" content="Simulación determinista 2D de agentes autónomos." />
      </Helmet>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Constructor de Mundos
          </h1>
          <StatusBadge status="DEMO" />
        </div>
        <p className="text-xl text-slate-300">
          Simulación determinista 2D de agentes autónomos
        </p>
      </div>

      <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-xl p-4 mb-12 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-accent-amber shrink-0 mt-0.5" />
        <div className="text-accent-amber text-sm md:text-base">
          <strong>⚠️ Visualización ilustrativa:</strong> Esta es una demostración web. El motor determinista real está en el{' '}
          <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">
            repositorio Python
          </a>. Seed 42 es la sesión canónica.
        </div>
      </div>

      <div className="w-full" aria-label="Contenedor principal del simulador">
        <ArtificialWorldSimulator />
      </div>
    </div>
  );
};

export default SimulationPage;
