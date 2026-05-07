'use client';

import { useEffect, useRef, useState } from 'react';
import { Player } from '@/types/game';

interface TypingRaceProps {
  sentence: string;
  mySymbol: Player;
  opponentProgress: number; // 0–1
  onComplete: (elapsedMs: number) => void;
  onProgress: (progress: number) => void;
  isCompleted: boolean;
  winner: Player | null;
  raceStartedAt: number;
}

export default function TypingRace({
  sentence,
  mySymbol,
  opponentProgress,
  onComplete,
  onProgress,
  isCompleted,
  winner,
  raceStartedAt,
}: TypingRaceProps) {
  const [typed, setTyped] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus input
  useEffect(() => {
    if (!isCompleted) inputRef.current?.focus();
  }, [isCompleted]);

  // Live timer
  useEffect(() => {
    if (isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - raceStartedAt);
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, raceStartedAt]);

  // Reset when new race starts
  useEffect(() => {
    setTyped('');
    completedRef.current = false;
  }, [sentence]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isCompleted || completedRef.current) return;

    const value = e.target.value;
    // Only accept if it matches the sentence prefix (allow backspace)
    if (value.length <= sentence.length) {
      setTyped(value);
      onProgress(value.length / sentence.length);

      if (value === sentence && !completedRef.current) {
        completedRef.current = true;
        onComplete(Date.now() - raceStartedAt);
      }
    }
  }

  const myProgress = typed.length / sentence.length;

  return (
    <div className="w-full max-w-xl animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">
          typing race — round {mySymbol}
        </p>
        <h2 className="text-lg font-mono text-white/80">
          Type faster to go first!
        </h2>
      </div>

      {/* Sentence display */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4 font-mono text-xl leading-relaxed tracking-wide">
        {sentence.split('').map((char, i) => {
          let color = 'text-white/25'; // not yet typed
          if (i < typed.length) {
            color = typed[i] === char ? 'text-green-400' : 'text-red-400';
          } else if (i === typed.length) {
            color = 'text-white/80'; // cursor position
          }
          return (
            <span key={i} className={`${color} transition-colors duration-75`}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleChange}
        disabled={isCompleted}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-base text-white focus:outline-none focus:border-white/30 disabled:opacity-40 mb-6"
        placeholder="Start typing..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Progress bars */}
      <div className="space-y-3">
        <ProgressBar
          label={`You (${mySymbol})`}
          progress={myProgress}
          color={mySymbol === 'X' ? '#00f5ff' : '#ff6b35'}
          isWinner={winner === mySymbol}
        />
        <ProgressBar
          label={`Opponent (${mySymbol === 'X' ? 'O' : 'X'})`}
          progress={opponentProgress}
          color={mySymbol === 'X' ? '#ff6b35' : '#00f5ff'}
          isWinner={winner !== null && winner !== mySymbol}
        />
      </div>

      {/* Timer */}
      {!isCompleted && (
        <p className="text-center mt-4 text-xs text-white/30 font-mono tabular-nums">
          {(elapsed / 1000).toFixed(1)}s
        </p>
      )}

      {/* Result banner */}
      {winner !== null && (
        <div
          className={`mt-6 text-center rounded-xl border py-3 px-6 font-mono text-sm animate-fade-in ${
            winner === mySymbol
              ? 'border-green-400/40 bg-green-400/10 text-green-400'
              : 'border-red-400/40 bg-red-400/10 text-red-400'
          }`}
        >
          {winner === mySymbol ? '⚡ You go first this round!' : '⏳ Opponent goes first...'}
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  progress,
  color,
  isWinner,
}: {
  label: string;
  progress: number;
  color: string;
  isWinner: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-white/50">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>
          {Math.round(progress * 100)}%
          {isWinner && ' ✓'}
        </span>
      </div>
      <div className="h-2 bg-card rounded-full overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
