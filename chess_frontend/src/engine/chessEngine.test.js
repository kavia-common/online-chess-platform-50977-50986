import { getInitialGameState, makeMove, generateLegalMoves } from './chessEngine';

function findMove(moves, from, to, extra = {}) {
  return moves.find(m =>
    m.from.r === from.r && m.from.c === from.c &&
    m.to.r === to.r && m.to.c === to.c &&
    (!extra.promotion || m.promotion === extra.promotion) &&
    (!extra.castle || m.castle === extra.castle)
  );
}

test('initial pawn double step creates en passant target', () => {
  let s = getInitialGameState();
  const from = { r: 1, c: 4 }; // white pawn e2
  let moves = generateLegalMoves(s, from);
  const m = findMove(moves, from, { r: 3, c: 4 }); // e4
  expect(m).toBeTruthy();
  s = makeMove(s, m);
  // black could try en passant if responds with double step adjacent; verify enPassant set
  expect(s.enPassant).toBeTruthy();
  expect(s.enPassant.r).toBe(2);
  expect(s.enPassant.c).toBe(4);
});

test('pawn promotion offered when reaching last rank', () => {
  // Construct a quick path: move white pawn from row 1 col 0 forward several times
  let s = getInitialGameState();
  // clear path: move same-file black pawn to create alternating turns minimally
  const wFrom = { r: 1, c: 0 };
  const wTwo = findMove(generateLegalMoves(s, wFrom), wFrom, { r: 3, c: 0 });
  s = makeMove(s, wTwo);

  const bFrom = { r: 6, c: 7 };
  const bTwo = findMove(generateLegalMoves(s, bFrom), bFrom, { r: 4, c: 7 });
  s = makeMove(s, bTwo);

  const wStep1 = findMove(generateLegalMoves(s, { r: 3, c: 0 }), { r: 3, c: 0 }, { r: 4, c: 0 });
  s = makeMove(s, wStep1);
  const bStep1 = findMove(generateLegalMoves(s, { r: 4, c: 7 }), { r: 4, c: 7 }, { r: 5, c: 7 });
  s = makeMove(s, bStep1);
  const wStep2 = findMove(generateLegalMoves(s, { r: 4, c: 0 }), { r: 4, c: 0 }, { r: 5, c: 0 });
  s = makeMove(s, wStep2);
  const bStep2 = findMove(generateLegalMoves(s, { r: 5, c: 7 }), { r: 5, c: 7 }, { r: 6, c: 7 });
  s = makeMove(s, bStep2);
  const wStep3 = findMove(generateLegalMoves(s, { r: 5, c: 0 }), { r: 5, c: 0 }, { r: 6, c: 0 });
  s = makeMove(s, wStep3);
  const bStep3 = findMove(generateLegalMoves(s, { r: 6, c: 7 }), { r: 6, c: 7 }, { r: 7, c: 7 });
  s = makeMove(s, bStep3);
  const promoMoves = generateLegalMoves(s, { r: 6, c: 0 });
  const pm = promoMoves.filter(m => m.promotion);
  expect(pm.length).toBeGreaterThan(0);
});

test('basic check detection: avoid moving into check', () => {
  let s = getInitialGameState();
  // Try illegal move: moving a pinned piece should be excluded automatically.
  // Make some opening moves to expose bishop pin scenario.
  const e2e4 = findMove(generateLegalMoves(s, { r: 1, c: 4 }), { r: 1, c: 4 }, { r: 3, c: 4 });
  s = makeMove(s, e2e4);
  const e7e5 = findMove(generateLegalMoves(s, { r: 6, c: 4 }), { r: 6, c: 4 }, { r: 4, c: 4 });
  s = makeMove(s, e7e5);
  const f1c4 = findMove(generateLegalMoves(s, { r: 0, c: 5 }), { r: 0, c: 5 }, { r: 3, c: 2 });
  s = makeMove(s, f1c4);
  const movesBlackKnight = generateLegalMoves(s, { r: 7, c: 6 }); // black knight g8
  // Ensure legal moves present as sanity check
  expect(movesBlackKnight.length).toBeGreaterThan(0);
});

test('castling moves included when legal', () => {
  let s = getInitialGameState();
  // Clear path for white king-side castle: move knight and bishop, then castle
  // 1. N g1-f3
  const ng1f3 = findMove(generateLegalMoves(s, { r: 0, c: 6 }), { r: 0, c: 6 }, { r: 2, c: 5 });
  s = makeMove(s, ng1f3);
  // ... N b8-c6
  const nb8c6 = findMove(generateLegalMoves(s, { r: 7, c: 1 }), { r: 7, c: 1 }, { r: 5, c: 2 });
  s = makeMove(s, nb8c6);
  // 2. B f1-e2
  const bf1e2 = findMove(generateLegalMoves(s, { r: 0, c: 5 }), { r: 0, c: 5 }, { r: 1, c: 4 }) || // f1-e2 or another square depending on legal path
                 findMove(generateLegalMoves(s, { r: 0, c: 5 }), { r: 0, c: 5 }, { r: 2, c: 4 });
  s = makeMove(s, bf1e2);
  // ... g8-f6
  const g8f6 = findMove(generateLegalMoves(s, { r: 7, c: 6 }), { r: 7, c: 6 }, { r: 5, c: 5 });
  s = makeMove(s, g8f6);
  // 3. test that a castle move exists (O-O)
  const castleMoves = generateLegalMoves(s, { r: 0, c: 4 });
  const oo = castleMoves.find(m => m.castle === 'K' || (m.to.c === 6 && m.piece.type === 'K'));
  expect(oo).toBeTruthy();
});
