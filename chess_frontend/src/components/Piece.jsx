import React from 'react';

const MAP = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

export default function Piece({ piece }) {
  const char = MAP[piece.color][piece.type];
  const colorStyle = piece.color === 'w' ? '#111827' : '#0f172a'; // near-black for contrast
  return (
    <span style={{ color: colorStyle, textShadow: '0 1px 0 rgba(255,255,255,0.65)' }}>
      {char}
    </span>
  );
}
