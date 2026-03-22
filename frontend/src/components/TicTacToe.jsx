/**
 * TicTacToe — 3 en raya con PvP y PvAI.
 * AI uses utility-based scoring from tictactoeAI.js.
 */
import { useState, useEffect, useCallback } from 'react';
import { checkWinner, checkDraw, getBestMove } from '../utils/tictactoeAI';

const AI_DELAY_MIN = 150;
const AI_DELAY_MAX = 400;

function randomDelay() {
  return AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);
}

export function TicTacToe({ onBack }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState('X');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'draw'
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState(null);
  const [mode, setMode] = useState('pvp');           // 'pvp' | 'pvai'
  const [difficulty, setDifficulty] = useState('hard');
  const [aiThinking, setAiThinking] = useState(false);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [draws, setDraws] = useState(0);

  const resolveGame = useCallback((newBoard) => {
    const result = checkWinner(newBoard);
    if (result) {
      setGameStatus('won');
      setWinner(result.winner);
      setWinLine(result.line);
      if (result.winner === 'X') setScoreX((s) => s + 1);
      else setScoreO((s) => s + 1);
      return true;
    }
    if (checkDraw(newBoard)) {
      setGameStatus('draw');
      setDraws((s) => s + 1);
      return true;
    }
    return false;
  }, []);

  const handleCellClick = useCallback((index) => {
    if (gameStatus !== 'playing') return;
    if (board[index] !== null) return;
    if (mode === 'pvai' && currentTurn === 'O') return;
    if (aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = currentTurn;
    setBoard(newBoard);

    if (!resolveGame(newBoard)) {
      setCurrentTurn((t) => (t === 'X' ? 'O' : 'X'));
    }
  }, [board, currentTurn, gameStatus, mode, aiThinking, resolveGame]);

  // AI move effect
  useEffect(() => {
    if (mode !== 'pvai') return;
    if (gameStatus !== 'playing') return;
    if (currentTurn !== 'O') return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      setAiThinking(false);
      const move = getBestMove(board, 'O', difficulty);
      if (move === null) return;

      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);

      if (!resolveGame(newBoard)) {
        setCurrentTurn('X');
      }
    }, randomDelay());

    return () => clearTimeout(timer);
  }, [board, currentTurn, mode, gameStatus, difficulty, resolveGame]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentTurn('X');
    setGameStatus('playing');
    setWinner(null);
    setWinLine(null);
    setAiThinking(false);
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetGame();
  };

  return (
    <div className="ttt">
      <div className="ttt-header">
        <button className="back-btn" onClick={onBack}>← Hub</button>
        <h2 className="ttt-title">3 en Raya</h2>
      </div>

      {/* Mode + difficulty selectors */}
      <div className="ttt-controls">
        <div className="ttt-mode-group">
          {[['pvp', '👥 2 Jugadores'], ['pvai', '🤖 vs IA']].map(([val, label]) => (
            <button
              key={val}
              className={`ttt-mode-btn ${mode === val ? 'active' : ''}`}
              onClick={() => handleModeChange(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'pvai' && (
          <div className="ttt-difficulty-group">
            {[['easy', 'Fácil'], ['medium', 'Medio'], ['hard', 'Difícil']].map(([val, label]) => (
              <button
                key={val}
                className={`ttt-diff-btn ${difficulty === val ? 'active' : ''}`}
                onClick={() => { setDifficulty(val); resetGame(); }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="ttt-score">
        <div className={`ttt-score-item ${winner === 'X' ? 'ttt-score-winner' : ''}`}>
          <span>{mode === 'pvai' ? '👤 Tú' : '✕ J1'}</span>
          <strong>{scoreX}</strong>
        </div>
        <div className="ttt-score-draws">
          <span>Empates</span>
          <strong>{draws}</strong>
        </div>
        <div className={`ttt-score-item ${winner === 'O' ? 'ttt-score-winner' : ''}`}>
          <span>{mode === 'pvai' ? '🤖 IA' : '○ J2'}</span>
          <strong>{scoreO}</strong>
        </div>
      </div>

      {/* Status */}
      <div className="ttt-status">
        {gameStatus === 'won' && (
          <span className="ttt-status-won">
            {mode === 'pvai'
              ? winner === 'X' ? '🎉 ¡Ganaste!' : '🤖 Gana la IA'
              : `🏆 Gana ${winner === 'X' ? 'J1 (✕)' : 'J2 (○)'}`}
          </span>
        )}
        {gameStatus === 'draw' && <span className="ttt-status-draw">🤝 Empate</span>}
        {gameStatus === 'playing' && (
          <span className="ttt-status-playing">
            {aiThinking
              ? '🤖 Pensando…'
              : `Turno: ${currentTurn === 'X'
                  ? (mode === 'pvai' ? '👤 Tú (✕)' : '✕ J1')
                  : (mode === 'pvai' ? '🤖 IA (○)' : '○ J2')}`}
          </span>
        )}
      </div>

      {/* Board */}
      <div className="ttt-board" aria-label="Tablero de 3 en raya">
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <button
              key={i}
              className={`ttt-cell ${cell ? `ttt-cell--${cell.toLowerCase()}` : ''} ${isWinCell ? 'ttt-cell--win' : ''}`}
              onClick={() => handleCellClick(i)}
              disabled={gameStatus !== 'playing' || cell !== null || aiThinking || (mode === 'pvai' && currentTurn === 'O')}
              aria-label={cell ? `Celda ${i + 1}: ${cell}` : `Celda ${i + 1}: vacía`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <button className="ttt-reset-btn" onClick={resetGame}>
        Nueva partida
      </button>
    </div>
  );
}
