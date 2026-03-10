
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Grid3X3, Disc, Crown } from 'lucide-react';
import SurfaceCard from '@/components/SurfaceCard.jsx';
import TicTacToe from '@/components/TicTacToe.jsx';
import Checkers from '@/components/Checkers.jsx';
import ComingSoonSurface from '@/components/ComingSoonSurface.jsx';

const GamesPage = () => {
  const [activeGame, setActiveGame] = useState(null);

  const games = [
    {
      id: 'tictactoe',
      title: '3 en Raya',
      description: 'El clásico juego de lógica. Reglas simples, entorno perfecto para probar la toma de decisiones básica.',
      status: 'REAL',
      icon: Grid3X3,
      cta: 'Jugar',
      disabled: false
    },
    {
      id: 'checkers',
      title: 'Damas',
      description: 'Juego de estrategia en tablero 8x8. Requiere planificación a futuro y evaluación de múltiples estados.',
      status: 'REAL',
      icon: Disc,
      cta: 'Jugar',
      disabled: false
    },
    {
      id: 'chess',
      title: 'Ajedrez',
      description: 'El pináculo de los juegos de tablero de información perfecta. Espacio de estados masivo.',
      status: 'ROADMAP',
      icon: Crown,
      cta: 'Ver estado',
      disabled: false
    }
  ];

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-950 min-h-screen">
      <Helmet>
        <title>Arena de Minijuegos | Artificial World</title>
        <meta name="description" content="Juegos clásicos en el ecosistema de Artificial World." />
      </Helmet>

      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Arena de Minijuegos
        </h1>
        <p className="text-xl text-slate-300">
          Juegos clásicos en el ecosistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {games.map((game) => (
          <div key={game.id} onClick={() => !game.disabled && setActiveGame(game.id)}>
            <SurfaceCard 
              title={game.title}
              description={game.description}
              status={game.status}
              icon={game.icon}
              cta={game.cta}
              disabled={game.disabled}
              link="#"
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeGame && (
          <motion.div
            key={activeGame}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
              <h2 className="text-2xl font-bold text-white">
                {games.find(g => g.id === activeGame)?.title}
              </h2>
              <button 
                onClick={() => setActiveGame(null)}
                className="text-sm text-slate-400 hover:text-accent-amber transition-colors font-medium"
              >
                Cerrar juego
              </button>
            </div>
            
            <div className="flex justify-center w-full">
              {activeGame === 'tictactoe' && <TicTacToe />}
              {activeGame === 'checkers' && <Checkers />}
              {activeGame === 'chess' && (
                <div className="w-full max-w-2xl">
                  <ComingSoonSurface 
                    title="Ajedrez"
                    description="El motor de ajedrez para los agentes está actualmente en desarrollo. Requiere un espacio de estados masivo que estamos optimizando."
                    status="ROADMAP"
                    repoLink="https://github.com/hermoso92/Artificial_world"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamesPage;
