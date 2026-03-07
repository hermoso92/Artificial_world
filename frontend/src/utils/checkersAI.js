/**
 * Checkers (Damas) AI engine using utility-based scoring.
 * Mirrors the simulation's utility-based decision philosophy.
 *
 * Board: 8x8, index 0..63. Only dark squares used (where (row+col)%2===1).
 * Pieces: 1 = player red, 2 = player red king, -1 = AI black, -2 = AI black king.
 */

export const EMPTY = 0;
export const RED = 1;
export const RED_KING = 2;
export const BLACK = -1;
export const BLACK_KING = -2;

export function isRed(p)   { return p === RED || p === RED_KING; }
export function isBlack(p) { return p === BLACK || p === BLACK_KING; }
export function isKing(p)  { return p === RED_KING || p === BLACK_KING; }

/** Create initial 8x8 board as flat array[64]. */
export function createInitialBoard() {
  const board = Array(64).fill(EMPTY);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row * 8 + col] = BLACK;
        if (row > 4) board[row * 8 + col] = RED;
      }
    }
  }
  return board;
}

function rc(row, col) { return row * 8 + col; }
function row(idx)     { return Math.floor(idx / 8); }
function col(idx)     { return idx % 8; }

/**
 * Returns all valid moves for a piece at `from`.
 * Each move: { from, to, captured: idx|null, isCapture }
 * Capture chains handled by getCaptureSequences.
 */
function getPieceMoves(board, from, forceCapture = false) {
  const piece = board[from];
  if (piece === EMPTY) return [];

  const r = row(from);
  const c = col(from);
  const dirs = [];

  if (isRed(piece) || isKing(piece))  dirs.push([-1, -1], [-1, 1]);
  if (isBlack(piece) || isKing(piece)) dirs.push([1, -1], [1, 1]);

  const captures = [];
  const moves = [];

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
    const neighbor = board[rc(nr, nc)];

    if (neighbor === EMPTY) {
      moves.push({ from, to: rc(nr, nc), captured: null, isCapture: false });
    } else {
      const isEnemy = (isRed(piece) && isBlack(neighbor)) || (isBlack(piece) && isRed(neighbor));
      if (isEnemy) {
        const jr = nr + dr;
        const jc = nc + dc;
        if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && board[rc(jr, jc)] === EMPTY) {
          captures.push({ from, to: rc(jr, jc), captured: rc(nr, nc), isCapture: true });
        }
      }
    }
  }

  if (forceCapture && captures.length > 0) return captures;
  if (captures.length > 0) return captures;
  return moves;
}

/** Apply a single-step move to board, returning new board. */
export function applyMove(board, move) {
  const newBoard = [...board];
  const piece = newBoard[move.from];
  newBoard[move.to] = piece;
  newBoard[move.from] = EMPTY;
  if (move.captured !== null) newBoard[move.captured] = EMPTY;

  // Promote to king
  const r = row(move.to);
  if (piece === RED && r === 0)   newBoard[move.to] = RED_KING;
  if (piece === BLACK && r === 7) newBoard[move.to] = BLACK_KING;

  return newBoard;
}

/** Get all legal moves for a player ('red' | 'black'). Captures are mandatory. */
export function getAllMoves(board, player) {
  const isPlayerPiece = player === 'red' ? isRed : isBlack;
  const allCaptures = [];
  const allMoves = [];

  for (let i = 0; i < 64; i++) {
    if (isPlayerPiece(board[i])) {
      const moves = getPieceMoves(board, i, false);
      for (const m of moves) {
        if (m.isCapture) allCaptures.push(m);
        else allMoves.push(m);
      }
    }
  }

  return allCaptures.length > 0 ? allCaptures : allMoves;
}

/** Utility score for a board state from black's (AI) perspective. */
function scoreBoard(board) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    const r = row(i);
    const c = col(i);
    const centerBonus = (3 - Math.abs(c - 3.5)) * 0.1;
    if (p === BLACK)       score += 3 + centerBonus + (r / 7) * 0.5;
    else if (p === BLACK_KING) score += 6 + centerBonus;
    else if (p === RED)    score -= 3 + centerBonus + ((7 - r) / 7) * 0.5;
    else if (p === RED_KING)   score -= 6 + centerBonus;
  }
  return score;
}

/** Minimax with alpha-beta pruning. depth 1=easy, 3=medium, 5=hard. */
function minimax(board, depth, alpha, beta, maximizing) {
  const moves = getAllMoves(board, maximizing ? 'black' : 'red');
  if (depth === 0 || moves.length === 0) return scoreBoard(board);

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const next = applyMove(board, m);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const next = applyMove(board, m);
      best = Math.min(best, minimax(next, depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

const DEPTH_BY_DIFFICULTY = { easy: 1, medium: 3, hard: 5 };

/** Returns best move for AI (black player). */
export function getAIMove(board, difficulty = 'hard') {
  const depth = DEPTH_BY_DIFFICULTY[difficulty] ?? 3;
  const moves = getAllMoves(board, 'black');
  if (moves.length === 0) return null;

  if (difficulty === 'easy' && Math.random() < 0.4) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const m of moves) {
    const next = applyMove(board, m);
    const s = minimax(next, depth - 1, -Infinity, Infinity, false);
    if (s > bestScore) { bestScore = s; bestMove = m; }
  }
  return bestMove;
}

/** Check game result: 'red' | 'black' | 'draw' | null (ongoing). */
export function checkGameResult(board) {
  const redMoves   = getAllMoves(board, 'red').length;
  const blackMoves = getAllMoves(board, 'black').length;
  const redPieces   = board.filter(isRed).length;
  const blackPieces = board.filter(isBlack).length;

  if (redPieces === 0 || redMoves === 0)   return 'black';
  if (blackPieces === 0 || blackMoves === 0) return 'red';
  return null;
}
