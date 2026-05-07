import { Cell, Player, GameState, TypingRaceState } from '@/types/game';

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

const TYPING_SENTENCES = [
  // Classic pangrams
  'the quick brown fox jumps over the lazy dog',
  'sphinx of black quartz judge my vow',
  'pack my box with five dozen liquor jugs',
  'how vexingly quick daft zebras jump',
  'the five boxing wizards jump quickly',
  'bright vixens jump dozy fowl quack',
  'waltz bad nymph for quick jigs vex',
  'cozy sphinx waves quart jug of bad milk',
  'two driven jocks help fax my big quiz',
  'quick zephyrs blow vexing daft jim',
  'the job requires extra pluck and zeal from every young wage earner',
  'a mad boxer shot a quick gloved jab to the jaw of his dizzy opponent',
  'five quacking zephyrs jolt my wax bed',
  'the lazy major was fixing the broken quiver of jets',
  'crazy fredrick bought many very exquisite opal jewels',

  // Short punchy phrases
  'type fast or lose first',
  'speed is the only advantage',
  'every keystroke counts in battle',
  'the faster you type the sooner you play',
  'fingers on the keyboard mind on the board',
  'no mistakes no mercy',
  'quick fingers win the game',
  'one wrong key costs you the lead',
  'focus and type without pause',
  'accuracy beats raw speed',

  // Medium difficulty — common words
  'practice makes perfect every single day',
  'a journey of a thousand miles begins with a single step',
  'the best way to predict the future is to create it',
  'not all those who wander are lost',
  'in the middle of difficulty lies opportunity',
  'the only way to do great work is to love what you do',
  'life is what happens when you are busy making other plans',
  'get busy living or get busy dying',
  'you only live once but if you do it right once is enough',
  'be the change you wish to see in the world',
  'it does not matter how slowly you go as long as you do not stop',
  'everything you can imagine is real',
  'the secret of getting ahead is getting started',
  'your time is limited so do not waste it living someone else life',
  'stay hungry stay foolish',

  // Tech and coding theme
  'real time multiplayer requires careful state management',
  'every player action must be synchronized across all clients',
  'latency is the enemy of a smooth multiplayer experience',
  'the database is the single source of truth',
  'broadcast channels carry ephemeral events between players',
  'optimistic updates make the game feel instant',
  'a well designed game loop keeps the state consistent',
  'pub sub patterns power most real time applications',
  'websockets maintain a persistent connection to the server',
  'supabase realtime listens for row level changes automatically',
  'row level security protects your data from unauthorized access',
  'json web tokens encode player identity securely',
  'deploy early and iterate based on real user feedback',
  'serverless functions scale automatically with demand',
  'edge computing reduces round trip latency significantly',

  // Fun and quirky
  'a wizard never types late nor early he types precisely when he means to',
  'may your fingers be swift and your errors be few',
  'the keyboard is mightier than the sword in this game',
  'caffeine and muscle memory carry the best typists',
  'ten fingers working in perfect harmony',
  'the home row is your friend never leave it',
  'touch typing is a superpower that takes practice to master',
  'never look at the keyboard your fingers know the way',
  'the rhythm of typing is almost musical when you are in flow',
  'mistakes happen but backspace is your safety net',

  // Animals
  'the cheetah is the fastest land animal on earth reaching top speeds quickly',
  'dolphins communicate using a complex system of clicks and whistles',
  'elephants never forget their friends or their enemies',
  'penguins are remarkably well adapted to the cold antarctic climate',
  'the octopus can change its color and texture in milliseconds',
  'wolves hunt in coordinated packs using sophisticated tactics',
  'hummingbirds can fly backwards and hover with incredible precision',
  'the blue whale is the largest animal that has ever lived on earth',

  // Space and science
  'the universe is approximately thirteen point eight billion years old',
  'light travels at nearly three hundred thousand kilometers per second',
  'black holes warp space and time beyond our comprehension',
  'the milky way contains over two hundred billion stars',
  'mars has the largest volcano in the entire solar system',
  'quantum entanglement connects particles across vast distances instantly',
  'the double helix structure of dna was discovered in nineteen fifty three',

  // Food
  'the perfect cup of coffee starts with freshly ground beans',
  'pizza margherita was named after the queen of italy in eighteen eighty nine',
  'chocolate is made from cacao beans that grow near the equator',
  'sushi originated in japan as a way of preserving fish in fermented rice',
  'bread has been baked by humans for at least fourteen thousand years',

  // Miscellaneous interesting facts
  'honey never spoils archaeologists found three thousand year old honey in tombs',
  'a group of flamingos is called a flamboyance which seems appropriate',
  'the shortest war in history lasted only thirty eight to forty five minutes',
  'cleopatra lived closer in time to the moon landing than to the pyramids',
  'oxford university is older than the aztec empire by several centuries',
  'wombats produce cube shaped droppings which is unique in the animal kingdom',
  'the word ninja originally referred to a spy not a warrior',
  'bananas are technically berries but strawberries are not',
  'a day on venus is longer than a year on venus due to its slow rotation',
  'humans share about sixty percent of their dna with a banana plant',
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
