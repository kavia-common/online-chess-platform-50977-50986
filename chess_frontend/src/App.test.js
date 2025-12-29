import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders board and allows basic selection and a legal pawn move', () => {
  render(<App />);
  const grid = screen.getByRole('grid', { name: /Chessboard/i });
  expect(grid).toBeInTheDocument();

  // Click white pawn at row 1 col 0 -> coordinate square-1-0
  const from = screen.getByLabelText('square-1-0');
  fireEvent.click(from);

  // Now a legal move should appear to square-2-0
  const to = screen.getByLabelText('square-2-0');
  fireEvent.click(to);

  // Move list should have 1 move
  expect(screen.getByText(/Moves/i)).toBeInTheDocument();
  // After first move, there should be "a3" or similar (since we use simple notation)
  // We only assert that there's 1 list item
  const listItems = grid.parentElement.parentElement.querySelectorAll('ol li');
  expect(listItems.length).toBe(1);
});
