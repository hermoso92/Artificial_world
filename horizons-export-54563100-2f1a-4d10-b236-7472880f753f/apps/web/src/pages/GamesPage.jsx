
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Trophy, Target } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import EcosystemNav from '@/components/EcosystemNav';
import TicTacToe from '@/components/TicTacToe';
import Checkers from '@/components/Checkers';

const GAMES = [
  { id: 'tictactoe', title: '3 en Raya', icon: Gamepad2, component: TicTacToe, available: true },
  { id: 'checkers', title: 'Damas', icon: Target, component: Checkers, available: true },
  { id: 'chess', title: 'Ajedrez', icon: Trophy, component: null, available: false },
];

const GamesPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [activeGame, setActiveGame] = useState(gameId || null);

  useEffect(() => {
    if (gameId && gameId !== activeGame) setActiveGame(gameId);
  }, [gameId]);

  const handleBack = () => {
    if (activeGame) {
      setActiveGame(null);
      navigate('/games');
    } else {
      navigate('/');
    }
  };

  if (activeGame && activeGame !== 'chess') {
    const game = GAMES.find((g) => g.id === activeGame);
    if (game?.component) {
      const GameComponent = game.component;
      return (
        <div className="min-h-screen bg-background text-foreground">
          <EcosystemNav />
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Button variant="ghost" className="mb-6" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> ← Arena
            </Button>
            <GameComponent />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Artificial World | Arena de minijuegos</title>
        <meta
          name="description"
          content="Arena pública con 3 en Raya y Damas jugables. Ajedrez sigue en roadmap dentro de esta build."
        />
      </Helmet>
      <EcosystemNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter">Arena de Minijuegos</h1>
            <p className="text-secondary mt-1">3 en Raya y Damas jugables. Ajedrez próximamente.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => g.available && (setActiveGame(g.id), navigate(`/games/${g.id}`))}
                disabled={!g.available}
                className={`bg-card rounded-xl p-6 border text-left transition-all duration-300 flex flex-col ${
                  g.available
                    ? 'border-border hover:border-primary/50 hover:shadow-xl cursor-pointer'
                    : 'border-border opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{g.title}</h3>
                {!g.available && (
                  <span className="text-xs font-bold text-warning mb-2">Próximamente</span>
                )}
                <span className="text-primary font-semibold text-sm mt-auto">
                  {g.available ? 'Jugar →' : 'En roadmap'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
