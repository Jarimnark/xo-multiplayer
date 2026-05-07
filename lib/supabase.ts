import { createClient } from '@supabase/supabase-js';
import { GameState } from '@/types/game';

// Fallback to empty strings so the build doesn't crash; real values come
// from environment variables at runtime (Vercel dashboard / .env.local).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchGame(gameId: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('games')
    .select('state')
    .eq('id', gameId)
    .single();

  if (error || !data) return null;
  return data.state as GameState;
}

export async function updateGame(gameState: GameState): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ state: gameState })
    .eq('id', gameState.id);

  if (error) throw error;
}

export async function createGame(gameState: GameState): Promise<void> {
  const { error } = await supabase
    .from('games')
    .insert({ id: gameState.id, state: gameState });

  if (error) throw error;
}

// Atomic claim for typing race — uses an RPC to avoid concurrent-claim bugs.
// Returns true if this player successfully claimed the race win.
export async function claimTypingRaceWin(
  gameId: string,
  newState: GameState
): Promise<boolean> {
  const { data, error } = await supabase.rpc('claim_typing_win', {
    p_game_id: gameId,
    p_new_state: newState,
  });

  if (error) {
    console.error('claim_typing_win error:', error);
    return false;
  }
  return data === true;
}
