import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Status banner displaying current state and whose turn.
 * Props:
 * - turn: 'w'|'b'
 * - inCheck: boolean
 * - status: 'playing'|'checkmate'|'stalemate'|'draw'
 * - lastMoveSAN: string | null
 */
export default function Status({ turn, inCheck, status, lastMoveSAN }) {
  const badge = {
    borderRadius: 999,
    padding: '6px 12px',
    fontWeight: 700,
    color: '#fff',
    background: inCheck ? '#EF4444' : '#3b82f6',
  };

  let txt = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
  if (status === 'checkmate') txt = 'Checkmate';
  else if (status === 'stalemate') txt = 'Stalemate';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      marginBottom: 12
    }}>
      <div style={badge}>{txt}{inCheck && status==='playing' ? ' • In check' : ''}</div>
      <div style={{ color: '#111827', fontWeight: 600 }}>
        Last move: {lastMoveSAN || '—'}
      </div>
    </div>
  );
}
