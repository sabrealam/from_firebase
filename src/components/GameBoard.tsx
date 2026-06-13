import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile, GameMode, AIDifficulty, GameState } from '../types';
import { RefreshCw, ArrowLeft, Hourglass, HelpCircle, AlertCircle, Zap } from 'lucide-react';

interface GameBoardProps {
  player1: PlayerProfile;
  player2: PlayerProfile | null; // null if vs CPU
  mode: GameMode;
  difficulty?: AIDifficulty;
  onGameFinished: (winner: 'X' | 'O' | 'Draw', durationSeconds: number, totalMoves: number) => void;
  onQuitGame: () => void;
}

// All possible winning combinations
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function GameBoard({
  player1,
  player2,
  mode,
  difficulty = 'medium',
  onGameFinished,
  onQuitGame
}: GameBoardProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // X is player1, O is player2 or CPU
  const [status, setStatus] = useState<'active' | 'completed'>('active');
  const [winner, setWinner] = useState<'X' | 'O' | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalMovesCount = board.filter(cell => cell !== null).length;

  // Track match timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Check board state for outcome after each move
  useEffect(() => {
    const outcome = checkWinner(board);
    if (outcome) {
      setStatus('completed');
      setWinner(outcome.winner);
      setWinningLine(outcome.line);
      // Let the main thread register game end with slightly delayed modal display
      setTimeout(() => {
        onGameFinished(outcome.winner, duration, totalMovesCount);
      }, 800);
      return;
    }

    // Is it a draw? (No nulls left)
    if (!board.includes(null)) {
      setStatus('completed');
      setWinner('Draw');
      setTimeout(() => {
        onGameFinished('Draw', duration, totalMovesCount);
      }, 800);
      return;
    }

    // If it's CPU turn (O) and mode is AI, run AI moves
    if (status === 'active' && mode === 'ai' && !isXNext) {
      setIsCpuThinking(true);
      const delay = Math.floor(Math.random() * 200) + 400; // Simulated computation latency (400-600ms)
      const cpuTimer = setTimeout(() => {
        const cpuMove = getCPUMove(board, difficulty);
        if (cpuMove !== -1) {
          makeMove(cpuMove, 'O');
        }
        setIsCpuThinking(false);
      }, delay);

      return () => clearTimeout(cpuTimer);
    }
  }, [board, isXNext, status, mode, difficulty]);

  // Main cell move trigger
  const handleCellClick = (idx: number) => {
    if (board[idx] || status === 'completed') return;
    
    // Block clicks during CPU thinking
    if (mode === 'ai' && !isXNext) return;

    const activeToken = isXNext ? 'X' : 'O';
    makeMove(idx, activeToken);
  };

  const makeMove = (idx: number, token: 'X' | 'O') => {
    setBoard(prev => {
      const copy = [...prev];
      copy[idx] = token;
      return copy;
    });
    setIsXNext(prev => !prev);
  };

  // Helper check winner
  const checkWinner = (squares: (string | null)[]) => {
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
      const [a, b, c] = WINNING_COMBOS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as 'X' | 'O', line: WINNING_COMBOS[i] };
      }
    }
    return null;
  };

  // --- CPU AI ALGORITHMS ---
  const getCPUMove = (squares: (string | null)[], level: AIDifficulty): number => {
    const emptyIndices: number[] = [];
    squares.forEach((cell, idx) => {
      if (cell === null) emptyIndices.push(idx);
    });

    if (emptyIndices.length === 0) return -1;

    // 1. EASY MODE: Random Select
    if (level === 'easy') {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // 2. MEDIUM MODE: Simple rules (Win or Block, else Random)
    if (level === 'medium') {
      // Check if CPU ('O') can win in this turn
      for (const idx of emptyIndices) {
        const temp = [...squares];
        temp[idx] = 'O';
        const outcome = checkWinner(temp);
        if (outcome && outcome.winner === 'O') return idx;
      }

      // Check if Player ('X') can win in their next turn - Block them!
      for (const idx of emptyIndices) {
        const temp = [...squares];
        temp[idx] = 'X';
        const outcome = checkWinner(temp);
        if (outcome && outcome.winner === 'X') return idx;
      }

      // If Center is empty, choose it 40% of the time
      if (squares[4] === null && Math.random() < 0.40) return 4;

      // Otherwise, select randomly
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // 3. HARD MODE: Absolute Unbeatable minimax algorithm
    // We are O (Computer), X is opponent
    let bestScore = -Infinity;
    let targetMove = -1;

    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          targetMove = i;
        }
      }
    }

    return targetMove !== -1 ? targetMove : emptyIndices[0];
  };

  // Minimax recursive evaluator
  const minimax = (tempSquares: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const outcome = checkWinner(tempSquares);
    if (outcome) {
      return outcome.winner === 'O' ? 10 - depth : depth - 10;
    }
    if (!tempSquares.includes(null)) {
      return 0; // Draw
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempSquares[i] === null) {
          tempSquares[i] = 'O';
          const score = minimax(tempSquares, depth + 1, false);
          tempSquares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempSquares[i] === null) {
          tempSquares[i] = 'X';
          const score = minimax(tempSquares, depth + 1, true);
          tempSquares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getActiveTurnText = () => {
    if (status === 'completed') {
      if (winner === 'Draw') return "Match Complete - Draw!";
      if (winner === 'X') return `${player1.username} Wins!`;
      return mode === 'ai' ? "CPU Wins!" : `${player2?.username || 'Player 2'} Wins!`;
    }

    if (isXNext) {
      return `${player1.username}'s Turn`;
    } else {
      if (mode === 'ai') {
        return isCpuThinking ? "CPU is calculating..." : "CPU's Turn";
      }
      return `${player2?.username || 'Player 2'}'s Turn`;
    }
  };

  const getActiveTurnColor = () => {
    if (isXNext) return player1.color;
    if (mode === 'ai') return 'text-violet-400';
    return player2?.color || 'text-cyan-400';
  };

  // Restart Board
  const resetLocalGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setStatus('active');
    setWinner(null);
    setWinningLine(null);
    setDuration(0);
  };

  return (
    <div className="flex flex-col items-center justify-between max-w-xl mx-auto py-2 px-4 sm:px-6 w-full h-full min-h-[500px]">
      
      {/* Top Controls Row */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
        <button
          id="quit-board-btn"
          onClick={onQuitGame}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Exit Lobby</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-850">
            <Hourglass size={12} className="animate-spin text-cyan-400" />
            <span>Time: {duration}s</span>
          </div>

          <button
            id="reset-board-btn"
            onClick={resetLocalGame}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-950 px-20 py-1 px-3 rounded border border-slate-850 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Head-to-Head Status Bar */}
      <div className="w-full bg-slate-950/80 rounded-2xl p-4 border border-slate-850/80 flex justify-between items-center relative overflow-hidden shadow-inner mb-6">
        {/* Progress Background Flash */}
        <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 bg-gradient-to-r opacity-5 ${
          isXNext ? 'from-rose-500 to-transparent w-1/2' : 'from-transparent to-cyan-500 w-1/2 right-0'
        }`} />

        {/* Player 1 Left */}
        <div className={`flex items-center gap-2.5 transition-all duration-300 ${isXNext ? 'scale-105' : 'opacity-60 scale-95'}`}>
          <span className="text-3xl">{player1.avatar}</span>
          <div className="text-left select-none">
            <span className={`text-sm font-black block leading-none ${player1.color}`}>
              {player1.username}
            </span>
            <span className="text-[10px] text-rose-400 font-bold tracking-widest font-mono">TOKEN: X</span>
          </div>
        </div>

        {/* Mid vs State indicator */}
        <div className="text-center font-mono z-10 px-2">
          {isCpuThinking ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="animate-bounce text-sm text-cyan-400 font-extrabold">···</span>
              <span className="text-[9px] uppercase text-cyan-500 block font-bold leading-none">AI THINKS</span>
            </div>
          ) : (
            <div className="text-slate-650 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800 text-[10px] font-bold text-slate-430">
              VS
            </div>
          )}
        </div>

        {/* Player 2 Right */}
        <div className={`flex items-center gap-2.5 transition-all duration-300 ${!isXNext ? 'scale-105 mr-1' : 'opacity-60 scale-95 mr-1'}`}>
          <div className="text-right select-none">
            <span className={`text-sm font-black block leading-none ${mode === 'ai' ? 'text-violet-400' : (player2?.color || 'text-cyan-400')}`}>
              {mode === 'ai' ? 'CPU AI' : (player2?.username || 'Guest')}
            </span>
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest font-mono">TOKEN: O</span>
          </div>
          <span className="text-3xl">{mode === 'ai' ? '🤖' : (player2?.avatar || '👤')}</span>
        </div>
      </div>

      {/* Primary Turn Title */}
      <h3 className={`text-lg font-black tracking-tight mb-5 transition-colors duration-300 ${getActiveTurnColor()}`}>
        {getActiveTurnText()}
      </h3>

      {/* THE TIC TAC TOE INTERACTIVE GRID CONTAINER */}
      <div className="w-full aspect-square max-w-[340px] bg-slate-950 rounded-2xl p-3 border border-slate-800 shadow-xl relative mt-1">
        {/* Interactive glow backing */}
        <div className="absolute inset-0 bg-slate-900 bg-opacity-20 blur-xl -z-10 rounded-2xl" />

        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            
            return (
              <button
                key={idx}
                id={`grid-cell-${idx}`}
                disabled={cell !== null || status === 'completed' || (mode === 'ai' && !isXNext)}
                onClick={() => handleCellClick(idx)}
                className={`text-6xl font-black rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  cell === null 
                    ? 'bg-slate-900 bg-opacity-50 hover:bg-slate-850 hover:bg-opacity-70 border border-slate-850/80 active:scale-95' 
                    : isWinningCell 
                      ? 'bg-gradient-to-br from-slate-900 to-indigo-950 border-2 border-indigo-500 shadow-inner'
                      : 'bg-slate-900 border border-slate-800/60'
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {cell && (
                    <motion.span
                      key={cell}
                      initial={{ opacity: 0, scale: 0.3, rotate: -250 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        rotate: 0,
                        color: cell === 'X' ? '#ec4899' : '#06b6d4', // rose-500 versus cyan-500
                        textShadow: isWinningCell ? (cell === 'X' ? '0 0 15px rgba(236,72,153,0.6)' : '0 0 15px rgba(6,182,212,0.6)') : 'none'
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 120 }}
                      className="select-none leading-none flex items-center justify-center pointer-events-none"
                    >
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom hint banner */}
      <div className="mt-6 text-center text-slate-500 text-[10px] uppercase tracking-widest font-mono flex items-center gap-1.5 p-2 justify-center leading-relaxed">
        <Zap size={10} className="text-amber-500 animate-pulse" />
        {mode === 'ai' 
          ? `Match difficulty: ${difficulty} AI` 
          : "Local Player vs Player Match"}
      </div>

    </div>
  );
}
