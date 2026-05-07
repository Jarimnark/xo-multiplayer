'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';

import { supabase, fetchGame, updateGame, claimTypingRaceWin } from '@/lib/supabase';
import {
  countPieces,
  createTypingRace,
  getOrCreatePlayerId,
  getPlayerName,
  applyMoveToState,
} from '@/lib/game-logic';
import { GameState, Player } from '@/types/game';

import Board from '@/components/Board';
import TypingRace from '@/components/TypingRace';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BroadcastPayload {
  playerId: string;
  progress: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [typingCompleted, setTypingCompleted] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const myPlayerId = useRef(getOrCreatePlayerId());
  const myName = searchParams.get('name') || getPlayerName();

  // Which symbol am I?
  const mySymbol: Player | null = game
    ? game.players.X === myPlayerId.current
      ? 'X'
      : game.players.O === myPlayerId.current
        ? 'O'
        : null
    : null;

  const isMyTurn = !!(game && game.phase === 'player_move' && game.activePlayer === mySymbol);
  const mustMove = !!(game && mySymbol && countPieces(game.board, mySymbol) >= 3);

  // ─── Load + join ────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function init() {
      const existing = await fetchGame(roomId);

      if (!existing) {
        if (mounted) setError('Room not found. Ask your opponent to share the code again.');
        return;
      }

      const isJoining = searchParams.get('join') === '1';
      const alreadyIn =
        existing.players.X === myPlayerId.current ||
        existing.players.O === myPlayerId.current;

      if (!alreadyIn && isJoining && existing.players.O === null) {
        const joined: GameState = {
          ...existing,
          players: { ...existing.players, O: myPlayerId.current },
          playerNames: { ...existing.playerNames, O: myName },
          phase: 'typing_race',
          typingRace: createTypingRace(),
        };
        await updateGame(joined);
        if (mounted) setGame(joined);
      } else if (!alreadyIn && existing.players.O !== null) {
        if (mounted) setError('This room is already full.');
      } else {
        if (mounted) setGame(existing);
      }
    }

    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ─── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return;

    // Pattern 1: Persistent state via DB subscription
    const dbChannel = supabase
      .channel(`db:games:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${roomId}` },
        payload => {
          const newState = payload.new.state as GameState;
          setGame(newState);
          if (newState.phase === 'typing_race') {
            setTypingCompleted(false);
            setOpponentProgress(0);
          }
        }
      )
      .subscribe();

    // Pattern 2: Ephemeral events via broadcast (not persisted to DB)
    const broadcastChannel = supabase
      .channel(`typing:${roomId}`)
      .on('broadcast', { event: 'typing_progress' }, ({ payload }: { payload: BroadcastPayload }) => {
        if (payload.playerId !== myPlayerId.current) {
          setOpponentProgress(payload.progress);
        }
      })
      .subscribe();

    channelRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [roomId]);

  // ─── Typing race ─────────────────────────────────────────────────────────────

  function broadcastProgress(progress: number) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing_progress',
      payload: { playerId: myPlayerId.current, progress } satisfies BroadcastPayload,
    });
  }

  const handleTypingComplete = useCallback(
    async (elapsedMs: number) => {
      if (!game || !mySymbol || typingCompleted) return;

      setTypingCompleted(true);

      const otherPlayer: Player = mySymbol === 'X' ? 'O' : 'X';

      const newState: GameState = {
        ...game,
        typingRace: game.typingRace
          ? { ...game.typingRace, completions: { ...game.typingRace.completions, [mySymbol]: elapsedMs }, winner: mySymbol }
          : null,
        phase: 'player_move',
        activePlayer: mySymbol,
        roundTurnOrder: [mySymbol, otherPlayer],
        roundMovesCompleted: 0,
      };

      // Atomic claim — the first player to finish wins the race
      const claimed = await claimTypingRaceWin(game.id, newState);
      if (!claimed) {
        // Opponent was already faster; their state update arrives via subscription
        console.log('[typing-race] opponent was faster');
      }
    },
    [game, mySymbol, typingCompleted]
  );

  // ─── Board moves ─────────────────────────────────────────────────────────────

  // The client who made the last move of a round is responsible for transitioning
  // to typing_race after a 3-second pause (so both players can see the final board).
  function scheduleRoundTransition(state: GameState) {
    if (state.phase !== 'round_end') return;
    setTimeout(async () => {
      await updateGame({
        ...state,
        phase: 'typing_race',
        typingRace: state.typingRace
          ? { ...state.typingRace, startedAt: Date.now(), completions: { X: null, O: null }, winner: null }
          : createTypingRace(),
      });
    }, 3000);
  }

  const handleCellClick = useCallback(
    async (cellIndex: number) => {
      if (!game || !mySymbol || !isMyTurn) return;

      const cell = game.board[cellIndex];

      if (mustMove) {
        if (game.selectedCell === null) {
          // First click: select own piece
          if (cell === mySymbol) {
            await updateGame({ ...game, selectedCell: cellIndex });
          }
        } else {
          if (cell === mySymbol) {
            // Change selection
            await updateGame({ ...game, selectedCell: cellIndex });
          } else if (cell === null) {
            // Move selected piece to empty cell
            const newState = applyMoveToState(game, game.selectedCell, cellIndex, mySymbol);
            await updateGame(newState);
            scheduleRoundTransition(newState);
          }
        }
      } else {
        // Placing new piece
        if (cell === null) {
          const newState = applyMoveToState(game, null, cellIndex, mySymbol);
          await updateGame(newState);
          scheduleRoundTransition(newState);
        }
      }
    },
    [game, mySymbol, isMyTurn, mustMove]
  );

  // ─── Play again ───────────────────────────────────────────────────────────────

  async function handlePlayAgain() {
    if (!game) return;
    await updateGame({
      ...game,
      board: Array(9).fill(null),
      phase: 'typing_race',
      activePlayer: null,
      selectedCell: null,
      winner: null,
      winningLine: null,
      typingRace: createTypingRace(),
      roundTurnOrder: null,
      roundMovesCompleted: 0,
      roundNumber: 0,
    });
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-400 font-mono mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="font-mono text-sm text-white/50 hover:text-white transition-colors">
            ← Back to home
          </button>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/30 font-mono animate-pulse">Loading game...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between w-full max-w-xl">
        <button onClick={() => router.push('/')} className="text-xs text-white/30 font-mono hover:text-white/60 transition-colors">
          ← Home
        </button>
        <RoomCodeBadge roomId={roomId} copied={copied} onCopy={copyRoomCode} />
      </div>

      {/* Player strip */}
      <PlayerStrip game={game} mySymbol={mySymbol} />

      {/* Phase content */}
      <div className="w-full max-w-xl">
        {game.phase === 'waiting' && (
          <WaitingScreen roomId={roomId} copied={copied} onCopy={copyRoomCode} />
        )}

        {game.phase === 'typing_race' && mySymbol && game.typingRace && (
          <TypingRace
            sentence={game.typingRace.sentence}
            mySymbol={mySymbol}
            opponentProgress={opponentProgress}
            onComplete={elapsedMs => {
              broadcastProgress(1);
              handleTypingComplete(elapsedMs);
            }}
            onProgress={p => broadcastProgress(p)}
            isCompleted={typingCompleted}
            winner={game.typingRace.winner}
            raceStartedAt={game.typingRace.startedAt}
          />
        )}

        {game.phase === 'typing_race' && !mySymbol && (
          <div className="text-center py-12">
            <p className="text-white/30 font-mono animate-pulse">Watching typing race...</p>
          </div>
        )}

        {game.phase === 'player_move' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <TurnBanner game={game} mySymbol={mySymbol} />
            <Board
              board={game.board}
              mySymbol={mySymbol}
              activePlayer={game.activePlayer}
              selectedCell={game.selectedCell}
              winningLine={game.winningLine}
              mustMove={isMyTurn ? mustMove : false}
              isMyTurn={isMyTurn}
              onCellClick={handleCellClick}
            />
          </div>
        )}

        {game.phase === 'round_end' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="text-sm font-mono px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60">
              Round complete — next race starting soon...
            </div>
            <Board
              board={game.board}
              mySymbol={mySymbol}
              activePlayer={null}
              selectedCell={null}
              winningLine={game.winningLine}
              mustMove={false}
              isMyTurn={false}
              onCellClick={() => {}}
            />
          </div>
        )}

        {game.phase === 'game_over' && (
          <GameOverScreen
            game={game}
            mySymbol={mySymbol}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>

      {game.phase !== 'waiting' && (
        <p className="text-xs text-white/20 font-mono">Round {game.roundNumber + 1}</p>
      )}
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoomCodeBadge({ roomId, copied, onCopy }: { roomId: string; copied: boolean; onCopy: () => void }) {
  return (
    <button onClick={onCopy} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 hover:border-white/30 transition-all">
      <span className="text-xs text-white/30 font-mono">Room</span>
      <span className="text-xs font-mono text-white tracking-widest">{roomId}</span>
      <span className="text-xs text-white/30">{copied ? '✓' : '⎘'}</span>
    </button>
  );
}

function PlayerStrip({ game, mySymbol }: { game: GameState; mySymbol: Player | null }) {
  return (
    <div className="flex items-center justify-between w-full max-w-xl text-xs font-mono">
      {(['X', 'O'] as Player[]).map(p => {
        const name = game.playerNames[p] || (game.players[p] ? '...' : 'Waiting...');
        const isMe = p === mySymbol;
        const isActive = game.activePlayer === p;
        return (
          <div key={p} className={`flex items-center gap-2 transition-opacity ${game.players[p] ? 'opacity-100' : 'opacity-30'}`}>
            <span className={`text-base font-bold ${p === 'X' ? 'neon-x' : 'neon-o'} ${isActive ? 'animate-pulse' : ''}`}>
              {p}
            </span>
            <span className="text-white/50">
              {name}
              {isMe && <span className="text-white/30"> (you)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TurnBanner({ game, mySymbol }: { game: GameState; mySymbol: Player | null }) {
  const isMyTurn = game.activePlayer === mySymbol;
  const activeName = game.activePlayer ? (game.playerNames[game.activePlayer] || game.activePlayer) : '';
  return (
    <div className={`text-sm font-mono px-4 py-2 rounded-lg border transition-all ${isMyTurn ? 'border-white/20 bg-white/5 text-white' : 'border-border text-white/30'}`}>
      {isMyTurn ? '⚡ Your turn' : `⏳ ${activeName}'s turn`}
    </div>
  );
}

function WaitingScreen({ roomId, copied, onCopy }: { roomId: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 animate-fade-in">
      <p className="text-white/40 font-mono text-sm">Waiting for opponent...</p>
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-xs text-white/30 font-mono mb-3 uppercase tracking-widest">Share this code</p>
        <p className="text-4xl font-bold text-white tracking-[0.3em] mb-4">{roomId}</p>
        <button onClick={onCopy} className="text-xs font-mono text-white/30 border border-border rounded-lg px-4 py-2 hover:border-white/30 hover:text-white/60 transition-all">
          {copied ? '✓ Copied!' : '⎘ Copy code'}
        </button>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

function GameOverScreen({
  game,
  mySymbol,
  onPlayAgain,
}: {
  game: GameState;
  mySymbol: Player | null;
  onPlayAgain: () => void;
}) {
  const isMyWin = game.winner === mySymbol;
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="text-center">
        {game.winner === 'draw' ? (
          <>
            <p className="text-4xl font-bold text-white/50 mb-2">Draw!</p>
            <p className="text-white/30 font-mono text-sm">No one wins this time.</p>
          </>
        ) : (
          <>
            <p className={`text-5xl font-bold mb-2 ${isMyWin ? 'neon-x' : 'neon-o'}`}>
              {isMyWin ? 'You Win!' : `${game.playerNames[game.winner as Player] || game.winner} Wins!`}
            </p>
            <p className={`font-mono text-sm ${isMyWin ? 'text-green-400' : 'text-red-400'}`}>
              {isMyWin ? '🏆 Congrats!' : '💀 Better luck next round'}
            </p>
          </>
        )}
      </div>

      <Board
        board={game.board}
        mySymbol={mySymbol}
        activePlayer={null}
        selectedCell={null}
        winningLine={game.winningLine}
        mustMove={false}
        isMyTurn={false}
        onCellClick={() => {}}
      />

      <button onClick={onPlayAgain} className="px-8 py-3 rounded-xl font-mono font-bold text-sm border border-x/40 text-x hover:bg-x/10 hover:border-x/80 transition-all">
        ⚡ Play Again
      </button>
    </div>
  );
}
