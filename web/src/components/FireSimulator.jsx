
import React from 'react';
import { Github, Flame } from 'lucide-react';

const FireSimulator = () => {
  return (
    <div
      className="min-h-[320px] flex flex-col items-center justify-center gap-6 py-16 px-6 bg-slate-900/50 rounded-xl border border-slate-700 border-dashed"
      role="status"
      aria-label="FireSimulator en desarrollo"
    >
      <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-600">
        <Flame className="w-8 h-8 text-accent-amber/70" aria-hidden="true" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Próximamente</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Simulación de propagación 2D en entornos controlados. El motor está en desarrollo en el repositorio principal.
        </p>
        <a
          href="https://github.com/hermoso92/Artificial_world"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-accent-amber font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          aria-label="Ver progreso en GitHub"
        >
          <Github className="w-4 h-4" aria-hidden="true" />
          Ver en GitHub
        </a>
      </div>
    </div>
  );
};

export default FireSimulator;
