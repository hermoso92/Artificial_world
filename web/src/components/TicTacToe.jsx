
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return squares.includes(null) ? null : { winner: 'Draw', line: [] };
  };

  const minimax = (squares, depth, isMaximizing) => {
    const result = checkWinner(squares);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          let score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          let score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const makeAIMove = () => {
    if (winner) return;
    let bestScore = -Infinity;
    let move = -1;
    const newBoard = [...board];

    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = 'O';
        let score = minimax(newBoard, 0, false);
        newBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }

    if (move !== -1) {
      newBoard[move] = 'O';
      setBoard(newBoard);
      setIsPlayerTurn(true);
      const result = checkWinner(newBoard);
      if (result) handleGameEnd(result);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(makeAIMove, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const handleGameEnd = (result) => {
    setWinner(result.winner);
    setWinningLine(result.line);
    if (result.winner === 'X') setStats(s => ({ ...s, wins: s.wins + 1 }));
    else if (result.winner === 'O') setStats(s => ({ ...s, losses: s.losses + 1 }));
    else setStats(s => ({ ...s, draws: s.draws + 1 }));
  };

  const handleClick = (i) => {
    if (board[i] || winner || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
    const result = checkWinner(newBoard);
    if (result) handleGameEnd(result);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setIsPlayerTurn(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 glass rounded-2xl max-w-md mx-auto shadow-2xl">
      <div className="flex justify-between w-full mb-8 text-sm font-mono bg-elevated p-4 rounded-xl border border-border">
        <div className="flex flex-col items-center">
          <span className="text-secondary mb-1">Tú (X)</span>
          <span className="text-success font-bold text-xl">{stats.wins}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-secondary mb-1">Empates</span>
          <span className="text-warning font-bold text-xl">{stats.draws}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-secondary mb-1">IA (O)</span>
          <span className="text-destructive font-bold text-xl">{stats.losses}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 bg-border p-3 rounded-2xl">
        {board.map((cell, i) => {
          const isWinningCell = winningLine.includes(i);
          return (
            <motion.button
              key={i}
              whileHover={!cell && !winner && isPlayerTurn ? { scale: 1.05 } : {}}
              whileTap={!cell && !winner && isPlayerTurn ? { scale: 0.95 } : {}}
              onClick={() => handleClick(i)}
              disabled={!!cell || !!winner || !isPlayerTurn}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl text-5xl font-black flex items-center justify-center transition-colors duration-300
                ${!cell && !winner && isPlayerTurn ? 'bg-card hover:bg-elevated cursor-pointer' : 'bg-card cursor-default'}
                ${cell === 'X' ? 'text-primary glow-cyan-text' : 'text-destructive'}
                ${isWinningCell ? 'bg-primary/20 border-2 border-primary' : 'border border-transparent'}
              `}
            >
              {cell && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {cell}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="h-12 mb-6 flex items-center justify-center w-full">
        {winner ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-bold text-xl flex items-center gap-2 px-6 py-2 rounded-full ${
              winner === 'X' ? 'bg-success/10 text-success border border-success/20' : 
              winner === 'O' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 
              'bg-warning/10 text-warning border border-warning/20'
            }`}
          >
            {winner === 'Draw' ? '¡Empate!' : winner === 'X' ? <><Trophy className="w-5 h-5" /> ¡Has ganado!</> : 'La IA gana'}
          </motion.div>
        ) : (
          <span className="text-secondary font-medium text-lg flex items-center gap-2">
            {isPlayerTurn ? (
              <><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Tu turno (X)</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span> Turno de la IA (O)...</>
            )}
          </span>
        )}
      </div>

      <Button onClick={resetGame} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-bold text-lg h-14">
        <RotateCcw className="w-5 h-5 mr-2" /> Nueva Partida
      </Button>
    </div>
  );
};

export default TicTacToe;
