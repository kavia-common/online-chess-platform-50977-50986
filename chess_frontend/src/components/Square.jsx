import React from 'react';

export default function Square({ r, c, dark, selected, legalTarget, lastMove, onClick, children }) {
  const base = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: dark ? '#94a3b8' : '#e5e7eb', // slate-400 / gray-200
    cursor: 'pointer',
    transition: 'background-color 140ms ease',
  };

  const selectedStyle = selected
    ? { boxShadow: 'inset 0 0 0 3px #3b82f6' }
    : {};

  const lastStyle = lastMove
    ? { outline: '2px solid rgba(59,130,246,0.5)' }
    : {};

  const legalStyle = legalTarget
    ? { backgroundImage: 'radial-gradient(rgba(6,182,212,0.35) 25%, rgba(0,0,0,0) 26%)' }
    : {};

  return (
    <div
      role="gridcell"
      aria-label={`square-${r}-${c}`}
      onClick={onClick}
      style={{ ...base, ...selectedStyle, ...legalStyle, ...lastStyle }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        fontSize: 'calc(16px + 1.2vmin)',
        userSelect: 'none'
      }}>
        {children}
      </div>
    </div>
  );
}
