/**
 * Checkers — Damas con PvP y PvAI.
 * AI usa minimax con alpha-beta, mismo espíritu que el motor utility-based de la simulación.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  createInitialBoard, getAllMoves, applyMove,
  checkGameResult, getAIMove,
  isRed, isBlack, isKing, RED, BLACK,
} from '../utils/checkersAI';

const AI_DELAY_MIN = 300;
const AI_DELAY_MAX = 700;

function randomDelay() {
  return AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);
}

export function Checkers({ onBack }) {
  const [board, setBoard]             = useState(createInitialBoard);
  const [selected, setSelected]       = useState(null);
  const [validMoves, setValidMoves]   = useState([]);
  const [currentTurn, setCurrentTurn] = useState('red');
  const [gameResult, setGameResult]   = useState(null);
  const [mode, setMode]               = useState('pvai');
  const [difficulty, setDifficulty]   = useState('hard');
  const [aiThinking, setAiThinking]   = useState(false);
  const [scoreRed, setScoreRed]       = useState(0);
  const [scoreBlack, setScoreBlack]   = useState(0);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setSelected(null);
    setValidMoves([]);
    setCurrentTurn('red');
    setGameResult(null);
    setAiThinking(false);
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetGame();
  };

  // AI move
  useEffect(() => {
    if (mode !== 'pvai') return;
    if (gameResult) return;
    if (currentTurn !== 'black') return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      setAiThinking(false);
      const move = getAIMove(board, difficulty);
      if (!move) return;
      const newBoard = applyMove(board, move);
      setBoard(newBoard);
      setSelected(null);
      setValidMoves([]);
      const result = checkGameResult(newBoard);
      if (result) {
        setGameResult(result);
        if (result === 'red')   setScoreRed((s) => s + 1);
        if (result === 'black') setScoreBlack((s) => s + 1);
      } else {
        setCurrentTurn('red');
      }
    }, randomDelay());

    return () => clearTimeout(timer);
  }, [board, currentTurn, mode, gameResult, difficulty]);

  const handleCellClick = useCallback((idx) => {
    if (gameResult) return;
    if (aiThinking) return;
    if (mode === 'pvai' && currentTurn === 'black') return;

    const piece = board[idx];
    const isCurrentPlayer = currentTurn === 'red' ? isRed(piece) : isBlack(piece);

    if (selected === null) {
      if (!isCurrentPlayer) return;
      const moves = getAllMoves(board, currentTurn).filter((m) => m.from === idx);
      if (moves.length === 0) return;
      setSelected(idx);
      setValidMoves(moves);
      return;
    }

    // Clicking same piece deselects
    if (idx === selected) {
      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Clicking another own piece changes selection
    if (isCurrentPlayer) {
      const moves = getAllMoves(board, currentTurn).filter((m) => m.from === idx);
      if (moves.length > 0) {
        setSelected(idx);
        setValidMoves(moves);
        return;
      }
    }

    // Try to move
    const move = validMoves.find((m) => m.to === idx);
    if (!move) {
      setSelected(null);
      setValidMoves([]);
      return;
    }

    const newBoard = applyMove(board, move);
    setBoard(newBoard);
    setSelected(null);
    setValidMoves([]);

    const result = checkGameResult(newBoard);
    if (result) {
      setGameResult(result);
      if (result === 'red')   setScoreRed((s) => s + 1);
      if (result === 'black') setScoreBlack((s) => s + 1);
    } else {
      setCurrentTurn((t) => (t === 'red' ? 'black' : 'red'));
    }
  }, [board, selected, validMoves, currentTurn, gameResult, aiThinking, mode]);

  const validMoveTos = new Set(validMoves.map((m) => m.to));

  function renderStatus() {
    if (gameResult === 'red') {
      return mode === 'pvai'
        ? <span className="chk-status-won">🎉 ¡Ganaste!</span>
        : <span className="chk-status-won">🏆 Ganan las Rojas</span>;
    }
    if (gameResult === 'black') {
      return mode === 'pvai'
        ? <span className="chk-status-lost">🤖 Gana la IA</span>
        : <span className="chk-status-won">🏆 Ganan las Negras</span>;
    }
    if (aiThinking) return <span className="chk-status-thinking">🤖 Pensando…</span>;
    const label = currentTurn === 'red'
      ? (mode === 'pvai' ? '👤 Tu turno (Rojas)' : '🔴 Turno Rojas')
      : (mode === 'pvai' ? '🤖 Turno IA (Negras)' : '⚫ Turno Negras');
    return <span className="chk-status-playing">{label}</span>;
  }

  return (
    <div className="chk">
      <div className="chk-header">
        <button className="back-btn" onClick={onBack}>← Minijuegos</button>
        <h2 className="chk-title">Damas</h2>
      </div>

      {/* Mode + difficulty */}
      <div className="chk-controls">
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
        <div className={`ttt-score-item ${gameResult === 'red' ? 'ttt-score-winner' : ''}`}>
          <span>{mode === 'pvai' ? '👤 Tú' : '🔴 Rojas'}</span>
          <strong>{scoreRed}</strong>
        </div>
        <div className="ttt-score-draws"><span>VS</span></div>
        <div className={`ttt-score-item ${gameResult === 'black' ? 'ttt-score-winner' : ''}`}>
          <span>{mode === 'pvai' ? '🤖 IA' : '⚫ Negras'}</span>
          <strong>{scoreBlack}</strong>
        </div>
      </div>

      <div className="chk-status">{renderStatus()}</div>

      {/* Board */}
      <div className="chk-board" aria-label="Tablero de damas">
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const idx = r * 8 + c;
            const isDark = (r + c) % 2 === 1;
            const piece = board[idx];
            const isSelected = selected === idx;
            const isTarget = validMoveTos.has(idx);
            const isCaptureTarget = validMoves.some((m) => m.to === idx && m.isCapture);

            return (
              <div
                key={idx}
                className={[
                  'chk-cell',
                  isDark ? 'chk-cell--dark' : 'chk-cell--light',
                  isSelected ? 'chk-cell--selected' : '',
                  isTarget ? 'chk-cell--target' : '',
                  isCaptureTarget ? 'chk-cell--capture' : '',
                ].join(' ')}
                onClick={() => isDark && handleCellClick(idx)}
                aria-label={`Celda ${r + 1}-${c + 1}`}
              >
                {piece !== 0 && (
                  <div
                    className={[
                      'chk-piece',
                      isRed(piece) ? 'chk-piece--red' : 'chk-piece--black',
                      isKing(piece) ? 'chk-piece--king' : '',
                    ].join(' ')}
                  >
                    {isKing(piece) ? '♛' : ''}
                  </div>
                )}
                {isTarget && piece === 0 && <div className="chk-target-dot" />}
              </div>
            );
          })
        )}
      </div>

      <button className="ttt-reset-btn" onClick={resetGame}>
        Nueva partida
      </button>
    </div>
  );
}
