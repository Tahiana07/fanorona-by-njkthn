import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Board3D', () => function MockBoard({ onPointClick }) {
  const React = require('react');
  return React.createElement(
    'div',
    null,
    Array.from({ length: 45 }, (_, point) => React.createElement(
      'button',
      { key: point, type: 'button', onClick: () => onPointClick(point), 'aria-label': `point ${point}` },
    )),
  );
});

test('renders the Fanorona game and its board choices', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /un jeu ancien/i })).toBeInTheDocument();
  expect(screen.getByText('Fanoron-tsivy')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Telo/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Dimy/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Tsivy/i })).toBeInTheDocument();
});

test('switches the interface language and opens the rules dialog', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Langue'), { target: { value: 'mg' } });
  expect(screen.getByRole('heading', { name: /Lalao lova/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Fitsipika/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('dialog').querySelector('#modal-title')).toHaveTextContent('Ny fomba fakana');
});

test('announces the winning color in a two-player Fanoron-telo game', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /À deux joueurs/i }));
  fireEvent.click(screen.getByRole('button', { name: /Telo/i }));

  [0, 3, 1, 4, 2].forEach((point) => {
    fireEvent.click(screen.getByRole('button', { name: `point ${point}` }));
  });

  expect(screen.getByRole('status')).toHaveTextContent('Les Blancs remportent la partie !');
});
