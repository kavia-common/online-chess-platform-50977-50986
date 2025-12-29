import React from 'react';

/**
 * PUBLIC_INTERFACE
 * MoveList renders the game's move history.
 * Props:
 * - moves: string[] of SAN-ish notations
 */
export default function MoveList({ moves }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '12px',
      maxHeight: '200px',
      overflowY: 'auto',
      fontSize: '14px'
    }}>
      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Moves</div>
      <ol style={{ margin: 0, paddingLeft: '20px' }}>
        {moves.map((m, idx) => (
          <li key={idx} style={{ marginBottom: 4 }}>{m}</li>
        ))}
      </ol>
    </div>
  );
}
