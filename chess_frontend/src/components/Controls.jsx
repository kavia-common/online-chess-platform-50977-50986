import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Controls for the game (undo, reset, new game; promotion choices if needed).
 * Props:
 * - onUndo, onReset, onNew
 * - promotionChoice: { pending: boolean, onChoose: (pieceType)=>void }
 */
export default function Controls({ onUndo, onReset, onNew, promotionChoice }) {
  const btn = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    background: '#3b82f6',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: 8
  };
  const secondary = {
    ...btn,
    background: '#06b6d4'
  };
  const ghost = {
    ...btn,
    background: '#fff',
    color: '#111827',
    border: '1px solid #e5e7eb'
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button style={btn} onClick={onUndo} aria-label="Undo last move">Undo</button>
      <button style={ghost} onClick={onReset} aria-label="Reset position">Reset</button>
      <button style={secondary} onClick={onNew} aria-label="Start new game">New Game</button>

      {promotionChoice?.pending && (
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '6px 10px',
          background: '#f9fafb',
          borderRadius: 10,
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>Promote to:</span>
          {['Q','R','B','N'].map(p => (
            <button
              key={p}
              style={{ ...ghost, padding: '8px 10px' }}
              onClick={() => promotionChoice.onChoose(p)}
              aria-label={`Promote to ${p}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
