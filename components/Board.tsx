'use client';

import { Cell, Player } from '@/types/game';

interface BoardProps {
  board: Cell[];
  mySymbol: Player | null;
  activePlayer: Player | null;
  selectedCell: number | null;
  winningLine: number[] | null;
  mustMove: boolean;
  isMyTurn: boolean;
  onCellClick: (index: number) => void;
}

export default function Board({
  board,
  mySymbol,
  activePlayer,
  selectedCell,
  winningLine,
  mustMove,
  isMyTurn,
  onCellClick,
}: BoardProps) {
  function getCellStyle(index: number): string {
    const cell = board[index];
    const isWinning = winningLine?.includes(index);
    const isSelected = selectedCell === index;
    const isEmpty = cell === null;

    let base =
      'relative flex items-center justify-center text-5xl font-bold rounded-xl border transition-all duration-150 select-none ';

    if (isWinning) {
      base += 'animate-win-flash border-yellow-400/60 bg-yellow-400/10 ';
    } else if (isSelected) {
      const color = cell === 'X' ? 'border-x/80 shadow-[0_0_24px_rgba(0,245,255,0.5)]' : 'border-o/80 shadow-[0_0_24px_rgba(255,107,53,0.5)]';
      base += `${color} bg-white/5 `;
    } else {
      base += 'border-border bg-card ';
    }

    // Hover / click cues
    if (isMyTurn && !winningLine) {
      if (mustMove) {
        // Can click own pieces to select, or empty cells if a piece is selected
        if ((cell === mySymbol) || (isEmpty && selectedCell !== null)) {
          base += 'cursor-pointer hover:border-white/30 hover:bg-white/5 ';
        } else {
          base += 'cursor-not-allowed opacity-60 ';
        }
      } else {
        if (isEmpty) {
          base += 'cursor-pointer hover:border-white/30 hover:bg-white/5 ';
        } else {
          base += 'cursor-not-allowed ';
        }
      }
    }

    return base;
  }

  function getCellTextStyle(cell: Cell, index: number): string {
    const isWinning = winningLine?.includes(index);

    if (cell === 'X') {
      return isWinning
        ? 'text-yellow-300 drop-shadow-[0_0_16px_rgba(255,215,0,0.9)]'
        : 'text-x drop-shadow-[0_0_12px_rgba(0,245,255,0.8)]';
    }
    if (cell === 'O') {
      return isWinning
        ? 'text-yellow-300 drop-shadow-[0_0_16px_rgba(255,215,0,0.9)]'
        : 'text-o drop-shadow-[0_0_12px_rgba(255,107,53,0.8)]';
    }
    return '';
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Always rendered — invisible keeps layout stable, visible shows the hint */}
      <p className={`text-sm text-yellow-400/80 font-mono animate-pulse ${mustMove && isMyTurn ? 'visible' : 'invisible'}`}>
        {selectedCell !== null ? '→ now tap an empty cell' : '⟳ tap your piece to move it'}
      </p>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[330px]">
        {board.map((cell, i) => (
          <button
            key={i}
            className={getCellStyle(i)}
            style={{ aspectRatio: '1' }}
            onClick={() => onCellClick(i)}
            disabled={!!winningLine}
            aria-label={cell ? `Cell ${i}: ${cell}` : `Cell ${i}: empty`}
          >
            <span className={`${getCellTextStyle(cell, i)} transition-all duration-100`}>
              {cell}
            </span>
            {/* Ghost indicator for where piece can move */}
            {isMyTurn && mustMove && selectedCell !== null && cell === null && (
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-white/10">
                ·
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Turn indicator strip */}
      <div className="flex gap-6 mt-1">
        {(['X', 'O'] as Player[]).map(p => (
          <div
            key={p}
            className={`flex items-center gap-2 transition-opacity duration-200 ${
              activePlayer === p ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                p === 'X' ? 'bg-x' : 'bg-o'
              } ${activePlayer === p ? (p === 'X' ? 'animate-pulse-x' : 'animate-pulse-o') : ''}`}
            />
            <span className={`text-xs font-mono ${p === 'X' ? 'text-x' : 'text-o'}`}>
              {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
