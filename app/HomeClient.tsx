'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/lib/supabase';
import { createInitialState, generateRoomId, getOrCreatePlayerId, setPlayerName } from '@/lib/game-logic';

export default function HomeClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    const trimmedName = name.trim() || 'Anonymous';
    setPlayerName(trimmedName);
    const playerId = getOrCreatePlayerId();
    const roomId = generateRoomId();
    const initialState = createInitialState(roomId, playerId, trimmedName);

    setLoading(true);
    setError('');
    try {
      await createGame(initialState);
      router.push(`/game/${roomId}`);
    } catch {
      setError('Failed to create game. Check your Supabase config in .env.local');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a valid room code.');
      return;
    }
    const trimmedName = name.trim() || 'Anonymous';
    setPlayerName(trimmedName);
    router.push(`/game/${code}?join=1&name=${encodeURIComponent(trimmedName)}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Title */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-6xl font-bold tracking-tight mb-2">
          <span className="neon-x">X</span>
          <span className="text-white/40">O</span>
          <span className="text-white ml-4">Battle</span>
        </h1>
        <p className="text-white/30 text-sm font-mono">
          Typing race · 3-piece limit · Real-time multiplayer
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 animate-fade-in">
        {/* Name input */}
        <div className="mb-6">
          <label className="block text-xs text-white/40 font-mono mb-2 uppercase tracking-widest">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-white/30 placeholder-white/20"
            onKeyDown={e => { if (e.key === 'Enter') mode === 'home' ? handleCreate() : handleJoin(); }}
          />
        </div>

        {mode === 'home' && (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl font-mono font-bold text-sm border border-x/40 text-x hover:bg-x/10 hover:border-x/80 transition-all disabled:opacity-40"
            >
              {loading ? 'Creating...' : '⚡ Create Game'}
            </button>
            <button
              onClick={() => { setMode('join'); setError(''); }}
              className="w-full py-3 rounded-xl font-mono text-sm border border-border text-white/50 hover:border-white/30 hover:text-white/80 transition-all"
            >
              Join Game →
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <label className="block text-xs text-white/40 font-mono mb-2 uppercase tracking-widest">
              Room Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3"
              maxLength={8}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white font-mono text-xl tracking-widest text-center focus:outline-none focus:border-white/30 placeholder-white/20 mb-4"
              autoComplete="off"
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            <div className="space-y-3">
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-mono font-bold text-sm border border-o/40 text-o hover:bg-o/10 hover:border-o/80 transition-all disabled:opacity-40"
              >
                Join →
              </button>
              <button
                onClick={() => { setMode('home'); setError(''); }}
                className="w-full py-3 rounded-xl font-mono text-sm border border-border text-white/30 hover:text-white/60 transition-all"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-400 font-mono text-center animate-fade-in">
            {error}
          </p>
        )}
      </div>

      {/* How to play */}
      <div className="mt-8 max-w-md text-center animate-fade-in">
        <p className="text-xs text-white/20 font-mono leading-relaxed">
          Each round starts with a typing race — the faster typist moves first.<br />
          Once you have <span className="text-white/40">3 pieces</span> on the board,
          you must <span className="text-white/40">move</span> one instead of placing new.
        </p>
      </div>
    </main>
  );
}
