import { Cell, Player, GameState, TypingRaceState } from '@/types/game';

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

const TYPING_SENTENCES = [
  'the quick brown fox jumps over the lazy dog',
  'sphinx of black quartz judge my vow',
  'pack my box with five dozen liquor jugs',
  'how vexingly quick daft zebras jump',
  'the five boxing wizards jump quickly',
  'bright vixens jump dozy fowl quack',
  'waltz bad nymph for quick jigs vex',
  'cozy sphinx waves quart jug of bad milk',
];

export function checkWinner(board: Cell[]): { winner: Player | 'draw' | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [...line] };
    }
  }
  if (board.every(c => c !== null)) return { winner: 'draw', line: null };
  return { winner: null, line: null };
}

export function countPieces(board: Cell[], player: Player): number {
  return board.filter(c => c === player).length;
}

export function getRandomSentence(): string {
  return TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
}

export function createTypingRace(sentence?: string): TypingRaceState {
  return {
    sentence: sentence ?? getRandomSentence(),
    startedAt: Date.now(),
    completions: { X: null, O: null },
    winner: null,
  };
}

export function createInitialState(gameId: string, hostId: string, hostName: string): GameState {
  return {
    id: gameId,
    board: Array(9).fill(null),
    players: { X: hostId, O: null },
    playerNames: { X: hostName, O: '' },
    phase: 'waiting',
    activePlayer: null,
    selectedCell: null,
    winner: null,
    winningLine: null,
    typingRace: null,
    roundTurnOrder: null,
    roundMovesCompleted: 0,
    roundNumber: 0,
  };
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('xo_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('xo_player_id', id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('xo_player_name') || 'Anonymous';
}

export function setPlayerName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('xo_player_name', name);
  }
}

export function applyMoveToState(
  game: GameState,
  fromCell: number | null,
  toCell: number,
  player: Player
): GameState {
  const newBoard = [...game.board];

  if (fromCell !== null) {
    newBoard[fromCell] = null;
  }
  newBoard[toCell] = player;

  const { winner, line } = checkWinner(newBoard);

  if (winner) {
    return {
      ...game,
      board: newBoard,
      selectedCell: null,
      winner,
      winningLine: line,
      phase: 'game_over',
      activePlayer: null,
    };
  }

  const isLastMoveOfRound = game.roundMovesCompleted === 1;

  if (isLastMoveOfRound) {
    // Pre-seed the next race sentence so both clients agree on it.
    // startedAt is 0 — the client who triggers the transition sets the real timestamp.
    return {
      ...game,
      board: newBoard,
      selectedCell: null,
      roundMovesCompleted: 0,
      roundNumber: game.roundNumber + 1,
      phase: 'round_end',
      activePlayer: null,
      typingRace: { ...createTypingRace(), startedAt: 0 },
    };
  }

  const otherPlayer = game.roundTurnOrder![1];
  return {
    ...game,
    board: newBoard,
    selectedCell: null,
    roundMovesCompleted: 1,
    activePlayer: otherPlayer,
  };
}
