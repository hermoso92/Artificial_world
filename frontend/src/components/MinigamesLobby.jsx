/**
 * MinigamesLobby — entry screen for the minigames pillar.
 */
import { useState } from 'react';
import { TicTacToe } from './TicTacToe';
import { Checkers } from './Checkers';

const GAMES = [
  {
    id: 'tictactoe',
    icon: '✕○',
    title: '3 en Raya',
    desc: 'El clásico. Juega contra un amigo o desafía a la IA utility-based.',
    modes: 'PvP · PvAI',
    available: true,
    color: '#7c3aed',
  },
  {
    id: 'checkers',
    icon: '🔴',
    title: 'Damas',
    desc: 'Evaluación de tablero, capturas múltiples, IA con profundidad adaptativa.',
    modes: 'PvP · PvAI',
    available: true,
    color: '#dc2626',
  },
  {
    id: 'chess',
    icon: '♟️',
    title: 'Ajedrez',
    desc: 'Máxima complejidad. Motor de decisión adaptado del núcleo de Artificial World.',
    modes: 'PvP · PvAI',
    available: false,
    color: '#ca8a04',
  },
];

export function MinigamesLobby({ onBack }) {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame === 'tictactoe') {
    return <TicTacToe onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'checkers') {
    return <Checkers onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="minigames">
      <div className="minigames-header">
        <button className="back-btn" onClick={onBack}>← Hub</button>
        <h2 className="minigames-title">🎮 Minijuegos</h2>
      </div>

      <p className="minigames-desc">
        Juegos clásicos con IAs que piensan. Las IAs usan el mismo motor utility-based
        que los agentes de la simulación — no son bots tontos.
      </p>

      <div className="minigames-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={`game-card ${!game.available ? 'game-card--disabled' : ''}`}
            style={{ '--game-color': game.color }}
            onClick={() => game.available && setActiveGame(game.id)}
            disabled={!game.available}
          >
            {!game.available && <span className="game-badge">Próximamente</span>}
            <div className="game-icon">{game.icon}</div>
            <div className="game-title">{game.title}</div>
            <div className="game-desc">{game.desc}</div>
            <div className="game-modes">{game.modes}</div>
            {game.available && <div className="game-cta">Jugar →</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
