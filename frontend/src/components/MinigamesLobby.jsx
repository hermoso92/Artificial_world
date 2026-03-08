/**
 * Arena — Desafía a tus habitantes.
 */
import { useState } from 'react';
import { TicTacToe } from './TicTacToe';
import { Checkers } from './Checkers';

const GAMES = [
  {
    id: 'tictactoe',
    icon: '✕○',
    title: '3 en Raya',
    desc: 'El clásico. Juega contra un amigo o desafía a los habitantes de tu mundo.',
    modes: 'Contra amigo · Contra tu IA',
    available: true,
    color: '#7c3aed',
  },
  {
    id: 'checkers',
    icon: '🔴',
    title: 'Damas',
    desc: 'Estrategia pura. Tu rival piensa, evalúa y se adapta a tu estilo.',
    modes: 'Contra amigo · Contra tu IA',
    available: true,
    color: '#dc2626',
  },
  {
    id: 'chess',
    icon: '♟️',
    title: 'Ajedrez',
    desc: 'La prueba definitiva. Rivales que aprenden del mismo mundo que construyes.',
    modes: 'Contra amigo · Contra tu IA',
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
        <h2 className="minigames-title">⚔️ Arena</h2>
      </div>

      <p className="minigames-desc">
        Juegos clásicos contra rivales que piensan de verdad. Los habitantes de tu mundo
        recuerdan cómo juegas y se adaptan.
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
