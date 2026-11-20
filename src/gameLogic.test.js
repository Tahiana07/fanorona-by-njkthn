import { applyMove, chooseAiMove, createGame, getLegalMoves, getWinner } from './gameLogic';

function emptyGame({ rows = 5, cols = 5, pieces, turn = 1 }) {
  const board = Array(rows * cols).fill(null);
  pieces.forEach(([row, col, player]) => { board[row * cols + col] = player; });
  return {
    variant: 'dimy',
    rows,
    cols,
    board,
    turn,
    chainPiece: null,
    visited: [],
    usedDirections: [],
    moveNumber: 1,
  };
}

test.each([
  ['telo', 0],
  ['dimy', 12],
  ['tsivy', 22],
])('sets up %s with %i pieces for each player', (variant, expected) => {
  const game = createGame(variant);
  expect(game.board.filter((piece) => piece === 1)).toHaveLength(expected);
  expect(game.board.filter((piece) => piece === 2)).toHaveLength(expected);
  if (variant !== 'telo') {
    expect(game.board[Math.floor(game.rows / 2) * game.cols + Math.floor(game.cols / 2)]).toBeNull();
  } else {
    expect(game.phase).toBe('placement');
  }
});

test('captures the contiguous line by approach and makes a capture compulsory', () => {
  const game = emptyGame({ pieces: [[2, 0, 1], [2, 2, 2], [2, 3, 2], [0, 0, 1]] });
  const moves = getLegalMoves(game);
  expect(moves.every((move) => move.captureType)).toBe(true);
  const move = moves.find((candidate) => candidate.from === 10 && candidate.to === 11);
  expect(move).toMatchObject({ captureType: 'approach', captures: [12, 13] });
  const next = applyMove(game, move);
  expect(next.board[12]).toBeNull();
  expect(next.board[13]).toBeNull();
  expect(next.turn).toBe(2);
});

test('captures pieces behind the starting point by withdrawal', () => {
  const game = emptyGame({ pieces: [[2, 2, 1], [2, 3, 2], [2, 4, 2], [0, 0, 2]] });
  const move = getLegalMoves(game).find((candidate) => candidate.captureType === 'withdrawal');
  expect(move).toMatchObject({ from: 12, to: 11, captureType: 'withdrawal', captures: [13, 14] });
  const next = applyMove(game, move);
  expect(next.board[13]).toBeNull();
  expect(next.board[14]).toBeNull();
});

test('continues a capture with the same piece and prevents revisiting points', () => {
  const game = emptyGame({ pieces: [[2, 0, 1], [2, 2, 2], [3, 1, 2]] });
  const firstMove = getLegalMoves(game).find((move) => move.from === 10 && move.to === 11);
  const chain = applyMove(game, firstMove);
  expect(chain.turn).toBe(1);
  expect(chain.chainPiece).toBe(11);
  expect(getLegalMoves(chain).every((move) => move.from === 11 && move.captureType)).toBe(true);

  const secondMove = getLegalMoves(chain)[0];
  const finished = applyMove(chain, secondMove);
  expect(finished.turn).toBe(2);
  expect(finished.chainPiece).toBeNull();
});

test('supports an AI move and detects when a side has no pieces', () => {
  const game = createGame('telo');
  expect(chooseAiMove(game, 'easy')).toEqual(expect.objectContaining({ from: null, to: expect.any(Number) }));
  const finished = emptyGame({ pieces: [[2, 2, 1]] });
  expect(getWinner(finished)).toBe(1);
});

test('allows a selected piece to move when no capture is available', () => {
  const game = emptyGame({ pieces: [[2, 2, 1], [0, 1, 2]] });
  const move = getLegalMoves(game, 12).find((candidate) => candidate.to === 13);

  expect(move).toMatchObject({ from: 12, to: 13, captureType: null });
  const next = applyMove(game, move);
  expect(next.turn).toBe(2);
  expect(next.board[12]).toBeNull();
  expect(next.board[13]).toBe(1);
});

test('keeps ordinary moves forbidden while another piece can capture', () => {
  const game = emptyGame({ pieces: [[2, 0, 1], [2, 2, 2], [1, 4, 1]] });

  expect(getLegalMoves(game, 9)).toEqual([]);
  expect(getLegalMoves(game).every((move) => move.captureType)).toBe(true);
});

test('places Fanoron-telo pieces in alternating turns and continues to movement', () => {
  let game = createGame('telo');
  for (const point of [0, 4, 2, 3, 6, 8]) {
    game = applyMove(game, getLegalMoves(game).find((move) => move.to === point));
  }

  expect(game.phase).toBe('play');
  expect(game.turn).toBe(1);
  expect(game.piecesPlaced).toEqual({ 1: 3, 2: 3 });
  expect(getWinner(game)).toBeNull();
  expect(getLegalMoves(game, 0).some((move) => move.to === 1)).toBe(true);
});

test('wins Fanoron-telo immediately when a player aligns three pieces while placing', () => {
  let game = createGame('telo');
  for (const point of [0, 3, 1, 4, 2, 6]) {
    game = applyMove(game, getLegalMoves(game).find((move) => move.to === point));
  }

  expect(getWinner(game)).toBe(1);
});
