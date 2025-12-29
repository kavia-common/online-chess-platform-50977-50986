import React from 'react';
import Square from './Square';
import Piece from './Piece';

/**
 * PUBLIC_INTERFACE
 * Board component renders an 8x8 grid of squares with pieces.
 * Props:
 * - board: 8x8 array of piece objects or null
 * - selected: {r,c} | null
 * - legalMoves: array of {to:{r,c}}
 * - onSquareClick: function({r,c})
 * - lastMove: {from:{r,c}, to:{r,c}} | null
 */
export default function Board({ board, selected, legalMoves, onSquareClick, lastMove }) {
  const sizeStyle = {
    width: 'min(90vmin, 560px)',
    aspectRatio: '1 / 1',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    border: '2px solid #e5e7eb',
  };

  const isLegalTo = (r, c) => legalMoves?.some((m) => m.to.r === r && m.to.c === c);

  const isLastMoveSquare = (r, c) => {
    if (!lastMove) return false;
    return (lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c);
  };

  return (
    <div style={sizeStyle} role="grid" aria-label="Chessboard">
      {board.map((row, r) =>
        row.map((cell, c) => {
          const dark = (r + c) % 2 === 1;
          const selectedSq = selected && selected.r === r && selected.c === c;
          const legalTo = isLegalTo(r, c);
          const last = isLastMoveSquare(r, c);

          return (
            <Square
              key={`${r}-${c}`}
              r={r}
              c={c}
              dark={dark}
              selected={selectedSq}
              legalTarget={legalTo}
              lastMove={last}
              onClick={() => onSquareClick({ r, c })}
            >
              {cell ? <Piece piece={cell} /> : null}
            </Square>
          );
        })
      )}
    </div>
  );
}
