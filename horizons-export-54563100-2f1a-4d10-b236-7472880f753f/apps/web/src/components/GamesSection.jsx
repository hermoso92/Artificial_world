
import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Target } from 'lucide-react';

const GamesSection = () => {
  const games = [
    { title: '3 en Raya', icon: <Gamepad2 />, desc: 'Implementación perfecta e imbatible. Juega contra la IA.', path: '/games/tictactoe', available: true },
    { title: 'Damas', icon: <Target />, desc: 'Resolución de árbol de decisiones con optimización de capturas múltiples.', path: '/games/checkers', available: true },
    { title: 'Ajedrez', icon: <Trophy />, desc: 'Motor Minimax con poda alfa-beta. En roadmap.', path: '/games', available: false },
  ];

  return (
    <section className="py-24 bg-elevated relative border-t border-border" id="games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">Entretenimiento y aprendizaje</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Juegos implementados en el ecosistema
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            3 en Raya y Damas jugables. Ajedrez próximamente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game, i) => (
            game.available ? (
              <Link
                key={i}
                to={game.path}
                className="glass p-8 rounded-2xl hover:border-primary/30 transition-colors group block"
              >
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-foreground mb-6 group-hover:text-primary transition-colors">
                  {game.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{game.title}</h3>
                <p className="text-secondary mb-6">{game.desc}</p>
                <span className="text-primary font-semibold hover:underline">Jugar ahora →</span>
              </Link>
            ) : (
              <div key={i} className="glass p-8 rounded-2xl border-border opacity-70">
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-foreground mb-6">
                  {game.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{game.title}</h3>
                <p className="text-secondary mb-6">{game.desc}</p>
                <span className="text-secondary text-sm font-semibold">Próximamente</span>
              </div>
            )
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
