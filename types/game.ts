export type Player = 'X' | 'O';
export type Cell = Player | null;
export type GamePhase = 'waiting' | 'typing_race' | 'player_move' | 'round_end' | 'game_over';

export interface TypingRaceState {
  sentence: string;
  startedAt: number;
  completions: { X: number | null; O: number | null };
  winner: Player | null;
}

export interface GameState {
  id: string;
  board: Cell[];
  players: { X: string | null; O: string | null };
  playerNames: { X: string; O: string };
  phase: GamePhase;
  activePlayer: Player | null;
  selectedCell: number | null;
  winner: Player | 'draw' | null;
  winningLine: number[] | null;
  typingRace: TypingRaceState | null;
  roundTurnOrder: [Player, Player] | null;
  roundMovesCompleted: number;
  roundNumber: number;
}
