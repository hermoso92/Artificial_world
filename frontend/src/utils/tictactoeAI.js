/**
 * Tic-tac-toe AI engine using utility-based scoring.
 * Mirrors the simulation's utility-based decision philosophy.
 */

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

export function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export function checkDraw(board) {
  return board.every((cell) => cell !== null);
}

function scoreCell(board, index, player) {
  const opponent = player === 'X' ? 'O' : 'X';

  // Check if placing here wins immediately
  const testWin = [...board];
  testWin[index] = player;
  if (checkWinner(testWin)) return 1000;

  // Check if blocking opponent from winning
  const testBlock = [...board];
  testBlock[index] = opponent;
  if (checkWinner(testBlock)) return 900;

  // Positional heuristics
  if (index === 4) return 30;             // center
  if ([0, 2, 6, 8].includes(index)) return 20; // corners
  return 10;                              // edges
}

/**
 * Returns the best cell index for `player` using utility scoring.
 * Returns null if no moves available.
 */
export function getBestMove(board, player, difficulty = 'hard') {
  const available = board
    .map((v, i) => (v === null ? i : null))
    .filter((i) => i !== null);

  if (available.length === 0) return null;

  // On 'easy', occasionally pick a random move instead of the best one
  if (difficulty === 'easy' && Math.random() < 0.45) {
    return available[Math.floor(Math.random() * available.length)];
  }

  const scored = available.map((i) => ({ index: i, score: scoreCell(board, i, player) }));
  scored.sort((a, b) => b.score - a.score);

  // On 'medium', pick randomly among the top 2 moves
  if (difficulty === 'medium' && scored.length >= 2 && Math.random() < 0.3) {
    return scored[Math.floor(Math.random() * 2)].index;
  }

  return scored[0].index;
}
