
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const INITIAL_BOARD = [
  [0, 2, 0, 2, 0, 2, 0, 2],
  [2, 0, 2, 0, 2, 0, 2, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
];

const Checkers = () => {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState(1); // 1 = Player (Red), 2 = AI (White)
  const [status, setStatus] = useState('Tu turno (Rojas)');
  const [stats, setStats] = useState({ player: 12, ai: 12 });

  const handleSquareClick = (r, c) => {
    if (turn !== 1) return;

    if (board[r][c] === 1 || board[r][c] === 3) {
      setSelectedPiece({ r, c });
    } else if (selectedPiece && board[r][c] === 0) {
      const dr = r - selectedPiece.r;
      const dc = Math.abs(c - selectedPiece.c);
      const isKing = board[selectedPiece.r][selectedPiece.c] === 3;
      const validDir = isKing ? true : dr === -1;

      if (dc === 1 && validDir && dr === (isKing ? dr : -1)) {
        executeMove(selectedPiece.r, selectedPiece.c, r, c);
      } else if (dc === 2 && Math.abs(dr) === 2) {
        const midR = selectedPiece.r + dr / 2;
        const midC = selectedPiece.c + (c - selectedPiece.c) / 2;
        if (board[midR][midC] === 2 || board[midR][midC] === 4) {
          executeMove(selectedPiece.r, selectedPiece.c, r, c, { r: midR, c: midC });
        }
      }
    }
  };

  const executeMove = (fromR, fromC, toR, toC, capture = null) => {
    const newBoard = board.map(row => [...row]);
    let piece = newBoard[fromR][fromC];
    
    if (piece === 1 && toR === 0) piece = 3;
    if (piece === 2 && toR === 7) piece = 4;

    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = 0;
    
    if (capture) {
      newBoard[capture.r][capture.c] = 0;
      setStats(s => ({ ...s, ai: s.ai - 1 }));
    }

    setBoard(newBoard);
    setSelectedPiece(null);
    
    if (stats.ai - (capture ? 1 : 0) === 0) {
      setStatus('¡Has ganado!');
      return;
    }

    setTurn(2);
    setStatus('Turno de la IA...');
    setTimeout(() => makeAIMove(newBoard), 600);
  };

  const makeAIMove = (currentBoard) => {
    let moved = false;
    // Try captures first
    for (let r = 0; r < 8 && !moved; r++) {
      for (let c = 0; c < 8 && !moved; c++) {
        if (currentBoard[r][c] === 2 || currentBoard[r][c] === 4) {
          const dirs = currentBoard[r][c] === 4 ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
          for (let [dr, dc] of dirs) {
            const nr = r + dr * 2, nc = c + dc * 2;
            const midR = r + dr, midC = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currentBoard[nr][nc] === 0) {
              if (currentBoard[midR][midC] === 1 || currentBoard[midR][midC] === 3) {
                const newBoard = currentBoard.map(row => [...row]);
                let piece = newBoard[r][c];
                if (piece === 2 && nr === 7) piece = 4;
                newBoard[nr][nc] = piece;
                newBoard[r][c] = 0;
                newBoard[midR][midC] = 0;
                setBoard(newBoard);
                setStats(s => ({ ...s, player: s.player - 1 }));
                moved = true;
                break;
              }
            }
          }
        }
      }
    }

    // Normal move
    if (!moved) {
      for (let r = 0; r < 8 && !moved; r++) {
        for (let c = 0; c < 8 && !moved; c++) {
          if (currentBoard[r][c] === 2 || currentBoard[r][c] === 4) {
            const dirs = currentBoard[r][c] === 4 ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            for (let [dr, dc] of dirs) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currentBoard[nr][nc] === 0) {
                const newBoard = currentBoard.map(row => [...row]);
                let piece = newBoard[r][c];
                if (piece === 2 && nr === 7) piece = 4;
                newBoard[nr][nc] = piece;
                newBoard[r][c] = 0;
                setBoard(newBoard);
                moved = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!moved || stats.player === 0) {
      setStatus(stats.player === 0 ? 'La IA gana' : '¡Has ganado! (IA sin movimientos)');
    } else {
      setTurn(1);
      setStatus('Tu turno (Rojas)');
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setSelectedPiece(null);
    setTurn(1);
    setStatus('Tu turno (Rojas)');
    setStats({ player: 12, ai: 12 });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 glass rounded-2xl max-w-lg mx-auto shadow-2xl">
      <div className="flex justify-between w-full mb-6 bg-elevated p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]"></div>
          <span className="font-bold text-foreground">Tú: {stats.player}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">IA: {stats.ai}</span>
          <div className="w-4 h-4 rounded-full bg-secondary shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-0 border-4 border-elevated mb-6 w-full max-w-[400px] aspect-square rounded-lg overflow-hidden shadow-2xl">
        {board.map((row, r) => row.map((cell, c) => {
          const isDark = (r + c) % 2 === 1;
          const isSelected = selectedPiece?.r === r && selectedPiece?.c === c;
          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleSquareClick(r, c)}
              className={`w-full h-full flex items-center justify-center relative
                ${isDark ? 'bg-[#181b22]' : 'bg-[#2a2f3a]'}
                ${isSelected ? 'ring-inset ring-4 ring-primary z-10' : ''}
                ${isDark && turn === 1 && !selectedPiece && (cell === 1 || cell === 3) ? 'cursor-pointer hover:bg-[#1f232d]' : ''}
                ${isDark && selectedPiece && cell === 0 ? 'cursor-pointer hover:bg-primary/20' : ''}
              `}
            >
              {cell !== 0 && (
                <motion.div 
                  layoutId={`piece-${r}-${c}`}
                  className={`w-[75%] h-[75%] rounded-full shadow-lg flex items-center justify-center border-2
                    ${cell === 1 || cell === 3 ? 'bg-destructive border-red-400' : 'bg-secondary border-gray-300'}
                  `}
                >
                  {cell > 2 && <Trophy className="w-4 h-4 text-warning opacity-80" />}
                </motion.div>
              )}
            </div>
          );
        }))}
      </div>

      <div className="h-10 mb-6 flex items-center justify-center w-full">
        <span className={`font-bold text-lg px-6 py-2 rounded-full ${
          status.includes('ganado') ? 'bg-success/10 text-success border border-success/20' :
          status.includes('IA gana') ? 'bg-destructive/10 text-destructive border border-destructive/20' :
          'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {status}
        </span>
      </div>

      <Button onClick={resetGame} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-bold">
        <RotateCcw className="w-5 h-5 mr-2" /> Reiniciar Partida
      </Button>
    </div>
  );
};

export default Checkers;
