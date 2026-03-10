
import React from 'react';
import { Helmet } from 'react-helmet';
import StatusBadge from '@/components/StatusBadge.jsx';
import FireSimulator from '@/components/FireSimulator.jsx';

const FireSimulatorPage = () => {
  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-950 min-h-screen">
      <Helmet>
        <title>FireSimulator | Artificial World</title>
        <meta name="description" content="Simulación de propagación 2D en el ecosistema Artificial World." />
      </Helmet>

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            FireSimulator
          </h1>
          <StatusBadge status="DEMO" />
        </div>
        <p className="text-xl text-slate-300">
          Simulación de propagación 2D
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 md:p-8 shadow-2xl" aria-label="Contenedor del simulador de fuego">
        <FireSimulator />
      </div>
    </div>
  );
};

export default FireSimulatorPage;
