export const BOARDS = {
  telo: { rows: 3, cols: 3, pieces: 3, label: 'Fanoron-telo' },
  dimy: { rows: 5, cols: 5, pieces: 12, label: 'Fanoron-dimy' },
  tsivy: { rows: 5, cols: 9, pieces: 22, label: 'Fanoron-tsivy' },
};

const pointId = (row, col, cols) => row * cols + col;
const directionId = (dr, dc) => `${dr},${dc}`;
const neighborCache = new Map();
const teloLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function connectedNeighbors(state, from) {
  const key = `${state.rows}x${state.cols}`;
  let neighborsByPoint = neighborCache.get(key);
  if (!neighborsByPoint) {
    neighborsByPoint = Array.from({ length: state.rows * state.cols }, (_, index) => {
      const row = Math.floor(index / state.cols);
      const col = index % state.cols;
      const neighbors = [];
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (nextRow < 0 || nextRow >= state.rows || nextCol < 0 || nextCol >= state.cols) continue;
          if (dr !== 0 && dc !== 0 && (row + col) % 2 !== 0) continue;
          neighbors.push({ to: pointId(nextRow, nextCol, state.cols), dr, dc });
        }
      }
      return neighbors;
    });
    neighborCache.set(key, neighborsByPoint);
  }
  return neighborsByPoint[from] || [];
}

export function createGame(variant = 'tsivy') {
  const { rows, cols, pieces } = BOARDS[variant];
  const board = Array(rows * cols).fill(null);

  if (variant !== 'telo') {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = pointId(row, col, cols);
        if (row < Math.floor(rows / 2)) board[index] = 2;
        if (row > Math.floor(rows / 2)) board[index] = 1;
      }
    }

    const middleRow = Math.floor(rows / 2);
    const middleCol = Math.floor(cols / 2);
    for (let col = 0; col < cols; col += 1) {
      if (col !== middleCol) {
        board[pointId(middleRow, col, cols)] = col < middleCol
          ? col % 2 === 0 ? 1 : 2
          : col % 2 === 0 ? 2 : 1;
      }
    }
  }

  return {
    variant,
    rows,
    cols,
    board,
    turn: 1,
    phase: variant === 'telo' ? 'placement' : 'play',
    piecesPlaced: variant === 'telo' ? { 1: 0, 2: 0 } : { 1: pieces, 2: pieces },
    chainPiece: null,
    visited: [],
    usedDirections: [],
    moveNumber: 1,
  };
}

function captureLine(state, from, dr, dc, type) {
  const row = Math.floor(from / state.cols);
  const col = from % state.cols;
  const direction = type === 'approach' ? 1 : -1;
  const distance = type === 'approach' ? 2 : 1;
  let nextRow = row + dr * distance * direction;
  let nextCol = col + dc * distance * direction;
  const captures = [];

  while (nextRow >= 0 && nextRow < state.rows && nextCol >= 0 && nextCol < state.cols) {
    const index = pointId(nextRow, nextCol, state.cols);
    if (state.board[index] !== 3 - state.turn) break;
    captures.push(index);
    nextRow += dr * direction;
    nextCol += dc * direction;
  }
  return captures;
}

function captureMovesForPiece(state, from) {
  const moves = [];
  for (const { to, dr, dc } of connectedNeighbors(state, from)) {
    if (state.board[to] !== null || state.visited.includes(to)) continue;
    if (state.usedDirections.includes(directionId(dr, dc))) continue;

    for (const captureType of ['approach', 'withdrawal']) {
      const captures = captureLine(state, from, dr, dc, captureType);
      if (captures.length) moves.push({ from, to, dr, dc, captureType, captures });
    }
  }
  return moves;
}

function piecesForPlayer(state, player) {
  const pieces = [];
  state.board.forEach((piece, index) => {
    if (piece === player) pieces.push(index);
  });
  return pieces;
}

function ordinaryMovesForPiece(state, from) {
  return connectedNeighbors(state, from)
    .filter(({ to }) => state.board[to] === null)
    .map(({ to, dr, dc }) => ({ from, to, dr, dc, captureType: null, captures: [] }));
}

export function getLegalMoves(state, from = null) {
  if (state.phase === 'placement') {
    if (from !== null) return [];
    return state.board.flatMap((piece, to) => (
      piece === null ? [{ from: null, to, dr: 0, dc: 0, captureType: null, captures: [], action: 'place' }] : []
    ));
  }
  if (state.chainPiece !== null) return captureMovesForPiece(state, state.chainPiece);

  const allPieces = piecesForPlayer(state, state.turn);
  const selectedPieces = from === null
    ? allPieces
    : state.board[from] === state.turn ? [from] : [];
  if (!selectedPieces.length) return [];

  if (state.variant === 'telo') {
    return selectedPieces.flatMap((piece) => ordinaryMovesForPiece(state, piece));
  }

  const captures = [];
  allPieces.forEach((piece) => captures.push(...captureMovesForPiece(state, piece)));
  if (captures.length) {
    return from === null ? captures : captures.filter((move) => move.from === from);
  }

  return selectedPieces.flatMap((piece) => ordinaryMovesForPiece(state, piece));
}

function countPieces(state) {
  const counts = { 1: 0, 2: 0 };
  state.board.forEach((piece) => {
    if (piece) counts[piece] += 1;
  });
  return counts;
}

function alignedPlayer(state) {
  if (state.variant !== 'telo') return null;
  for (const player of [1, 2]) {
    if (teloLines.some((line) => line.every((index) => state.board[index] === player))) return player;
  }
  return null;
}

function immediateWinner(state, counts = countPieces(state)) {
  const aligned = alignedPlayer(state);
  if (aligned) return aligned;
  if (state.phase === 'placement') return null;
  if (counts[1] === 0) return 2;
  if (counts[2] === 0) return 1;
  return null;
}

export function applyMove(state, move) {
  const legalMoves = getLegalMoves(state, move.from);
  const legalMove = legalMoves.find((candidate) => (
    candidate.to === move.to
    && candidate.from === move.from
    && candidate.captureType === move.captureType
    && candidate.dr === move.dr
    && candidate.dc === move.dc
    && candidate.action === move.action
  ));
  if (!legalMove) return state;

  if (state.phase === 'placement') {
    const board = state.board.slice();
    board[move.to] = state.turn;
    const piecesPlaced = { ...state.piecesPlaced, [state.turn]: state.piecesPlaced[state.turn] + 1 };
    const nextTurn = 3 - state.turn;
    const phase = piecesPlaced[1] === BOARDS.telo.pieces && piecesPlaced[2] === BOARDS.telo.pieces
      ? 'play'
      : 'placement';
    return {
      ...state,
      board,
      piecesPlaced,
      phase,
      turn: nextTurn,
      moveNumber: state.moveNumber + 1,
    };
  }

  return applyLegalMove(state, legalMove);
}

function applyLegalMove(state, move) {
  const board = state.board.slice();
  board[move.to] = board[move.from];
  board[move.from] = null;
  move.captures.forEach((index) => { board[index] = null; });

  const visited = [...state.visited, move.from];
  const usedDirections = [...state.usedDirections, directionId(move.dr, move.dc)];
  const next = {
    ...state,
    board,
    chainPiece: null,
    visited: [],
    usedDirections: [],
    moveNumber: state.moveNumber,
  };

  if (move.captureType) {
    next.chainPiece = move.to;
    next.visited = visited;
    next.usedDirections = usedDirections;
    if (captureMovesForPiece(next, move.to).length) return next;
  }

  next.chainPiece = null;
  next.visited = [];
  next.usedDirections = [];
  next.turn = 3 - state.turn;
  next.moveNumber = state.moveNumber + 1;
  return next;
}

export function getWinner(state) {
  const counts = countPieces(state);
  const winner = immediateWinner(state, counts);
  if (winner || state.phase === 'placement') return winner;
  if (getLegalMoves(state).length === 0) return 3 - state.turn;
  return null;
}

function evaluate(state, counts, mobility) {
  const material = (counts[1] - counts[2]) * 100;
  const turnMobility = state.turn === 1 ? mobility : -mobility;
  if (state.variant !== 'telo') return material + turnMobility;

  let alignmentPotential = 0;
  teloLines.forEach((line) => {
    const playerOne = line.filter((index) => state.board[index] === 1).length;
    const playerTwo = line.filter((index) => state.board[index] === 2).length;
    if (playerTwo === 0) alignmentPotential += playerOne * playerOne * 12;
    if (playerOne === 0) alignmentPotential -= playerTwo * playerTwo * 12;
  });
  return material + turnMobility + alignmentPotential;
}

function search(state, depth, alpha, beta) {
  const counts = countPieces(state);
  const winner = immediateWinner(state, counts);
  if (winner) return { score: winner === 1 ? 10000 + depth : -10000 - depth };

  const moves = getLegalMoves(state);
  if (moves.length === 0) return { score: state.turn === 1 ? -10000 - depth : 10000 + depth };
  if (depth === 0) return { score: evaluate(state, counts, moves.length) };

  moves.sort((a, b) => b.captures.length - a.captures.length);
  let bestMove = moves[0];
  const maximizing = state.turn === 1;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = state.phase === 'placement'
      ? applyMove(state, move)
      : applyLegalMove(state, move);
    const score = search(next, depth - 1, alpha, beta).score;
    if ((maximizing && score > bestScore) || (!maximizing && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
    if (maximizing) alpha = Math.max(alpha, bestScore);
    else beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return { score: bestScore, move: bestMove };
}

export function chooseAiMove(state, difficulty = 'intermediate') {
  const depths = { easy: 1, intermediate: 2, hard: 3 };
  const result = search(state, depths[difficulty] || depths.intermediate, -Infinity, Infinity);
  return result.move || null;
}
