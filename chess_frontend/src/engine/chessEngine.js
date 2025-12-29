//
// Simple chess engine for local two-player play.
// Implements legal move generation, checks, checkmate, stalemate,
// castling, en passant, and promotion hooks.
//
// Board representation:
// - 8x8 array: board[r][c], r,c in [0..7], r=0 is White's back rank (top)
// - Pieces are objects: { type: 'K,Q,R,B,N,P', color: 'w'|'b', hasMoved?: boolean }
// Coordinates: { r, c } zero-based.
// Turns: 'w' or 'b'.
//
// PUBLIC INTERFACE functions are marked accordingly.
//

// Utilities
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const cloneBoard = (board) => board.map((row) => row.map((p) => (p ? { ...p } : null)));

const coordEq = (a, b) => a.r === b.r && a.c === b.c;

// Directions
const KNIGHT_DIRS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
const KING_DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
];
const ROOK_DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
const BISHOP_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1";

// Convert FEN to board (limited: ignores castling/en-passant fields for setup)
function fenToBoard(fen) {
  const [placement] = fen.split(" ");
  const rows = placement.split("/");
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  rows.forEach((row, rIdx) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        c += parseInt(ch, 10);
      } else {
        const color = ch === ch.toLowerCase() ? "b" : "w";
        const type = ch.toUpperCase();
        board[rIdx][c] = { type, color, hasMoved: false };
        c++;
      }
    }
  });
  return board;
}

// Find king position
function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "K" && p.color === color) {
        return { r, c };
      }
    }
  }
  return null;
}

// Squares attacked by opponent helper: used to validate king safety and castling
function isSquareAttacked(board, r, c, byColor) {
  // Pawns
  const dir = byColor === "w" ? 1 : -1; // white pawns attack downwards in our r indexing (since white at top r=0)
  const pawnAttackers = [
    { r: r - dir, c: c - 1 },
    { r: r - dir, c: c + 1 },
  ];
  for (const sq of pawnAttackers) {
    if (inBounds(sq.r, sq.c)) {
      const p = board[sq.r][sq.c];
      if (p && p.color === byColor && p.type === "P") return true;
    }
  }

  // Knights
  for (const [dr, dc] of KNIGHT_DIRS) {
    const rr = r + dr, cc = c + dc;
    if (!inBounds(rr, cc)) continue;
    const p = board[rr][cc];
    if (p && p.color === byColor && p.type === "N") return true;
  }

  // Bishops/Queens diagonals
  for (const [dr, dc] of BISHOP_DIRS) {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
      const p = board[rr][cc];
      if (p) {
        if (p.color === byColor && (p.type === "B" || p.type === "Q")) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  // Rooks/Queens orthogonals
  for (const [dr, dc] of ROOK_DIRS) {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
      const p = board[rr][cc];
      if (p) {
        if (p.color === byColor && (p.type === "R" || p.type === "Q")) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }

  // King
  for (const [dr, dc] of KING_DIRS) {
    const rr = r + dr, cc = c + dc;
    if (!inBounds(rr, cc)) continue;
    const p = board[rr][cc];
    if (p && p.color === byColor && p.type === "K") return true;
  }

  return false;
}

// Make a move on a cloned board, return new board and aux state updates
function applyMove(board, move) {
  const nb = cloneBoard(board);
  const piece = nb[move.from.r][move.from.c];
  nb[move.from.r][move.from.c] = null;

  // En passant capture
  if (move.enPassant && move.captured && move.capturedSquare) {
    nb[move.capturedSquare.r][move.capturedSquare.c] = null;
  }

  // Castling: move rook as well
  if (move.castle === "K") {
    // king-side: rook from (r,7) to (r,5)
    const r = move.from.r;
    const rook = nb[r][7];
    nb[r][7] = null;
    nb[r][5] = { ...rook, hasMoved: true };
  } else if (move.castle === "Q") {
    // queen-side: rook from (r,0) to (r,3)
    const r = move.from.r;
    const rook = nb[r][0];
    nb[r][0] = null;
    nb[r][3] = { ...rook, hasMoved: true };
  }

  // Place piece (handle promotion)
  const newPiece = { ...piece, hasMoved: true, type: move.promotion || piece.type };
  nb[move.to.r][move.to.c] = newPiece;

  return nb;
}

// Generate pseudo-legal moves for a piece at from
function generatePieceMoves(board, from) {
  const p = board[from.r][from.c];
  if (!p) return [];
  const moves = [];
  const pushMove = (to, extra = {}) => {
    const tgt = board[to.r][to.c];
    if (!tgt || tgt.color !== p.color) {
      moves.push({ from, to, piece: p, captured: tgt || null, ...extra });
      return true;
    }
    return false;
  };

  if (p.type === "P") {
    const dir = p.color === "w" ? 1 : -1; // white moves down in our r index
    const startRow = p.color === "w" ? 1 : 6;
    const promoRow = p.color === "w" ? 7 : 0;

    const one = { r: from.r + dir, c: from.c };
    if (inBounds(one.r, one.c) && !board[one.r][one.c]) {
      if (one.r === promoRow) {
        ["Q","R","B","N"].forEach((prom) => pushMove(one, { promotion: prom }));
      } else {
        pushMove(one);
      }
      const two = { r: from.r + 2 * dir, c: from.c };
      if (from.r === startRow && inBounds(two.r, two.c) && !board[two.r][two.c]) {
        pushMove(two, { doubleStep: true });
      }
    }
    // captures
    for (const dc of [-1, 1]) {
      const cap = { r: from.r + dir, c: from.c + dc };
      if (inBounds(cap.r, cap.c)) {
        const tgt = board[cap.r][cap.c];
        if (tgt && tgt.color !== p.color) {
          if (cap.r === promoRow) {
            ["Q","R","B","N"].forEach((prom) => {
              moves.push({ from, to: cap, piece: p, captured: tgt, promotion: prom });
            });
          } else {
            moves.push({ from, to: cap, piece: p, captured: tgt });
          }
        }
      }
    }
    // En passant handled in generateLegalMoves using gameState.enPassant
  } else if (p.type === "N") {
    for (const [dr, dc] of KNIGHT_DIRS) {
      const to = { r: from.r + dr, c: from.c + dc };
      if (inBounds(to.r, to.c)) pushMove(to);
    }
  } else if (p.type === "B" || p.type === "R" || p.type === "Q") {
    const dirs = [];
    if (p.type === "B" || p.type === "Q") dirs.push(...BISHOP_DIRS);
    if (p.type === "R" || p.type === "Q") dirs.push(...ROOK_DIRS);
    for (const [dr, dc] of dirs) {
      let rr = from.r + dr, cc = from.c + dc;
      while (inBounds(rr, cc)) {
        const moved = pushMove({ r: rr, c: cc });
        const tgt = board[rr][cc];
        if (tgt) break;
        rr += dr; cc += dc;
      }
    }
  } else if (p.type === "K") {
    for (const [dr, dc] of KING_DIRS) {
      const to = { r: from.r + dr, c: from.c + dc };
      if (inBounds(to.r, to.c)) pushMove(to);
    }
    // Castling handled in generateLegalMoves (needs attack info)
  }

  return moves;
}

// Filter pseudo-legal to legal by checking king safety
function filterLegal(board, moves, color, state) {
  const legal = [];
  for (const m of moves) {
    // handle en passant possibility
    if (m.piece.type === "P" && state.enPassant) {
      const dir = m.piece.color === "w" ? 1 : -1;
      // enPassant square is where pawn can move to capture
      if (m.to.r === state.enPassant.r && m.to.c === state.enPassant.c && m.to.c !== m.from.c) {
        // Ensure target square empty and captured pawn behind
        const capturedSquare = { r: m.to.r - dir, c: m.to.c };
        const capPawn = board[capturedSquare.r]?.[capturedSquare.c];
        if (capPawn && capPawn.type === "P" && capPawn.color !== m.piece.color) {
          m.enPassant = true;
          m.captured = capPawn;
          m.capturedSquare = capturedSquare;
        }
      }
    }

    // handle castling
    if (m.piece.type === "K" && !m.piece.hasMoved && m.from.c === 4) {
      // same row
      if (m.to.c === 6) m.castle = "K";
      if (m.to.c === 2) m.castle = "Q";
    }

    let nb = applyMove(board, m);
    const kingPos = findKing(nb, color);
    if (!kingPos) continue;
    const attacked = isSquareAttacked(nb, kingPos.r, kingPos.c, color === "w" ? "b" : "w");
    if (attacked) continue;

    // additional castle path checks: squares can't be attacked and must be empty
    if (m.castle) {
      const r = m.from.r;
      if (m.castle === "K") {
        // squares f,g must be empty and not attacked; rook must exist and unmoved
        const rook = board[r][7];
        if (!rook || rook.type !== "R" || rook.color !== color || rook.hasMoved) continue;
        if (board[r][5] || board[r][6]) continue;
        // squares e,f,g not attacked
        if (
          isSquareAttacked(board, r, 4, color === "w" ? "b" : "w") ||
          isSquareAttacked(board, r, 5, color === "w" ? "b" : "w") ||
          isSquareAttacked(board, r, 6, color === "w" ? "b" : "w")
        ) continue;
      } else if (m.castle === "Q") {
        const rook = board[m.from.r][0];
        if (!rook || rook.type !== "R" || rook.color !== color || rook.hasMoved) continue;
        if (board[m.from.r][1] || board[m.from.r][2] || board[m.from.r][3]) continue;
        if (
          isSquareAttacked(board, m.from.r, 4, color === "w" ? "b" : "w") ||
          isSquareAttacked(board, m.from.r, 3, color === "w" ? "b" : "w") ||
          isSquareAttacked(board, m.from.r, 2, color === "w" ? "b" : "w")
        ) continue;
      }
    }

    legal.push(m);
  }
  return legal;
}

function allMovesForColor(board, color, state) {
  const res = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      let pm = generatePieceMoves(board, { r, c });
      // add king castling pseudo-targets so filterLegal can evaluate
      if (p.type === "K" && !p.hasMoved) {
        // attempt to include castle targets if rook conditions and empty squares exist
        // K-side
        if (c === 4) {
          if (board[r][5] === null && board[r][6] === null) {
            pm.push({ from: { r, c }, to: { r, c: 6 }, piece: p, captured: null });
          }
          // Q-side
          if (board[r][1] === null && board[r][2] === null && board[r][3] === null) {
            pm.push({ from: { r, c }, to: { r, c: 2 }, piece: p, captured: null });
          }
        }
      }
      const legal = filterLegal(board, pm, color, state);
      res.push(...legal);
    }
  }
  return res;
}

function isInCheck(board, color) {
  const k = findKing(board, color);
  if (!k) return false;
  return isSquareAttacked(board, k.r, k.c, color === "w" ? "b" : "w");
}

function simpleNotation(move) {
  const files = "abcdefgh";
  const ranks = "12345678";
  const pieceLetter = move.piece.type === "P" ? "" : move.piece.type;
  const capture = move.captured ? "x" : "";
  const toSq = files[move.to.c] + ranks[move.to.r];
  let san = pieceLetter + capture + toSq;
  if (move.castle === "K") san = "O-O";
  if (move.castle === "Q") san = "O-O-O";
  if (move.promotion) san += "=" + move.promotion;
  return san;
}

// PUBLIC_INTERFACE
export function getInitialGameState() {
  /**
   * Returns initial game state with a fresh board and metadata.
   */
  const board = fenToBoard(initialFen);
  return {
    board,
    turn: "w",
    inCheck: false,
    status: "playing", // 'playing'|'checkmate'|'stalemate'|'draw'
    moveHistory: [],
    // enPassant: square where a pawn could capture after last double step (r,c)
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

// PUBLIC_INTERFACE
export function generateLegalMoves(state, from) {
  /**
   * Generate legal moves for the piece at 'from' square using current state.
   * Returns an array of move objects.
   */
  const { board, turn } = state;
  const p = board[from.r]?.[from.c];
  if (!p || p.color !== turn) return [];
  let pseudo = generatePieceMoves(board, from);

  // Insert potential en-passant captures if applicable: handled in filterLegal via state.enPassant
  const legal = filterLegal(board, pseudo, turn, state);
  return legal;
}

// PUBLIC_INTERFACE
export function makeMove(state, move) {
  /**
   * Apply a legal move to the state and return a new updated state.
   * If move is not legal, returns original state unchanged.
   */
  const legalMoves = generateLegalMoves(state, move.from);
  const isLegal = legalMoves.some((m) =>
    coordEq(m.to, move.to) &&
    (m.promotion || null) === (move.promotion || null) &&
    ((m.castle || null) === (move.castle || null))
  );
  if (!isLegal) return state;

  let board = applyMove(state.board, move);

  // Update enPassant target
  let enPassant = null;
  if (move.piece.type === "P" && move.doubleStep) {
    const dir = move.piece.color === "w" ? 1 : -1;
    enPassant = { r: move.from.r + dir, c: move.from.c };
  }

  const nextTurn = state.turn === "w" ? "b" : "w";
  const inCheck = isInCheck(board, nextTurn);
  const nextMoves = allMovesForColor(board, nextTurn, { enPassant });

  let status = "playing";
  if (nextMoves.length === 0) {
    status = inCheck ? "checkmate" : "stalemate";
  }

  // move history: store SAN-ish
  const notation = simpleNotation(move);
  const moveHistory = [...state.moveHistory, notation];

  const halfmoveClock =
    move.piece.type === "P" || move.captured ? 0 : state.halfmoveClock + 1;
  const fullmoveNumber = state.turn === "b" ? state.fullmoveNumber + 1 : state.fullmoveNumber;

  return {
    board,
    turn: nextTurn,
    inCheck,
    status,
    moveHistory,
    enPassant,
    halfmoveClock,
    fullmoveNumber,
  };
}

// PUBLIC_INTERFACE
export function getAllLegalMoves(state) {
  /**
   * Returns all legal moves for the current player.
   */
  return allMovesForColor(state.board, state.turn, { enPassant: state.enPassant });
}

// PUBLIC_INTERFACE
export function isCheckmate(state) {
  /** Return true if current player is checkmated. */
  return state.status === "checkmate";
}

// PUBLIC_INTERFACE
export function isStalemate(state) {
  /** Return true if stalemate position. */
  return state.status === "stalemate";
}
