export type GameMode = 'ai' | 'local';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  maxStreak: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  avatar: string; // Emoji character or key
  color: string;  // Tailwind text color class e.g., 'text-rose-500' or hex
  stats: PlayerStats;
  theme: string;  // Player preferred theme prefix
  createdAt: number;
}

export interface GameHistoryItem {
  id: string;
  player1Id: string;
  player1Name: string;
  player2Id: string; // 'cpu' or second player id
  player2Name: string;
  winnerId: string | 'draw' | 'cpu'; // id of the winner profile, or 'draw' or 'cpu'
  winnerName: string | 'Draw';
  mode: GameMode;
  difficulty?: AIDifficulty;
  totalMoves: number;
  durationSeconds: number;
  timestamp: number;
}

export interface GameState {
  board: (string | null)[]; // Array of 9 elements: 'X' | 'O' | null
  isXNext: boolean;
  status: 'active' | 'completed' | 'paused';
  winner: 'X' | 'O' | 'Draw' | null;
  winningLine: number[] | null; // e.g. [0, 1, 2]
  movesCount: number;
}
