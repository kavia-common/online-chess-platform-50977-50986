import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Board from './components/Board';
import MoveList from './components/MoveList';
import Controls from './components/Controls';
import Status from './components/Status';
import {
  getInitialGameState,
  generateLegalMoves,
  makeMove,
  getAllLegalMoves
} from './engine/chessEngine';

// PUBLIC_INTERFACE
function App() {
  /**
   * Main two-player chess app.
   * Renders the board, interaction handlers, status, controls, and move history.
   */
  const [theme, setTheme] = useState('light');
  const [history, setHistory] = useState([getInitialGameState()]);
  const [cursor, setCursor] = useState(0);
  const state = history[cursor];

  const [selected, setSelected] = useState(null);
  const [legal, setLegal] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (selected) {
      setLegal(generateLegalMoves(state, selected));
    } else {
      setLegal([]);
    }
  }, [selected, state]);

  const onSquareClick = (sq) => {
    if (pendingPromotion) return; // block until promotion selected
    const p = state.board[sq.r][sq.c];

    // Select if own piece at turn
    if (p && p.color === state.turn) {
      setSelected(sq);
      return;
    }

    // Try move if we have selection
    if (selected) {
      const move = legal.find(m => m.to.r === sq.r && m.to.c === sq.c);
      if (move) {
        // If move is promotion without specified piece, prompt
        if (move.promotion && !move.castle) {
          setPendingPromotion({ baseMove: move });
          return;
        }
        applyMove(move);
      } else {
        // Clear selection if clicking elsewhere
        setSelected(null);
      }
    }
  };

  const applyMove = (move) => {
    const next = makeMove(state, move);
    if (next !== state) {
      const newHist = [...history.slice(0, cursor + 1), next];
      setHistory(newHist);
      setCursor(newHist.length - 1);
      setSelected(null);
      setLastMove({ from: move.from, to: move.to });
    }
  };

  const promotionChoice = pendingPromotion
    ? {
        pending: true,
        onChoose: (pieceType) => {
          const base = pendingPromotion.baseMove;
          const chosen = { ...base, promotion: pieceType };
          setPendingPromotion(null);
          applyMove(chosen);
        }
      }
    : { pending: false };

  const onUndo = () => {
    if (cursor > 0) {
      setCursor(cursor - 1);
      setSelected(null);
      setPendingPromotion(null);
      setLastMove(null);
    }
  };

  const onReset = () => {
    const init = getInitialGameState();
    setHistory([init]);
    setCursor(0);
    setSelected(null);
    setPendingPromotion(null);
    setLastMove(null);
  };

  const onNew = () => onReset();

  const allMoves = useMemo(() => getAllLegalMoves(state), [state]);
  const lastMoveSAN = state.moveHistory[state.moveHistory.length - 1] || null;

  return (
    <div className="App" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="App-header"
        style={{
          background: '#f9fafb',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div
          className="container"
          style={{
            maxWidth: 1100,
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 16,
          }}
        >
          <h1 style={{ color: '#111827', margin: 0 }}>Chess</h1>
          <p style={{ color: '#6b7280', marginTop: 0 }}>
            Two-player local play. Primary #3b82f6, Accents #06b6d4.
          </p>

          <Status
            turn={state.turn}
            inCheck={state.inCheck}
            status={state.status}
            lastMoveSAN={lastMoveSAN}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 16,
            }}
          >
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Board
                board={state.board}
                selected={selected}
                legalMoves={legal}
                onSquareClick={onSquareClick}
                lastMove={lastMove}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 12,
              }}
            >
              <Controls
                onUndo={onUndo}
                onReset={onReset}
                onNew={onNew}
                promotionChoice={promotionChoice}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 12,
                }}
              >
                <MoveList moves={state.moveHistory} />
                <div style={{ color: '#6b7280', fontSize: 14 }}>
                  Legal moves available: <strong>{allMoves.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
