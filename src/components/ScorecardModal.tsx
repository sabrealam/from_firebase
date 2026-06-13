import React from 'react';
import { motion } from 'motion/react';
import { PlayerProfile, GameMode, AIDifficulty } from '../types';
import { Trophy, RefreshCw, LayoutDashboard, Calendar, BarChart2, Zap, Award, Flame } from 'lucide-react';

interface ScorecardModalProps {
  winnerToken: 'X' | 'O' | 'Draw';
  durationSeconds: number;
  totalMoves: number;
  mode: GameMode;
  difficulty?: AIDifficulty;
  player1: PlayerProfile;
  player2: PlayerProfile | null;
  onPlayAgain: () => void;
  onGoToDashboard: () => void;
}

export default function ScorecardModal({
  winnerToken,
  durationSeconds,
  totalMoves,
  mode,
  difficulty,
  player1,
  player2,
  onPlayAgain,
  onGoToDashboard
}: ScorecardModalProps) {

  // Resolve winner details
  const getWinnerNode = () => {
    if (winnerToken === 'Draw') {
      return {
        title: "Match Ended in a Draw",
        subtitle: "A balanced standoff of tactics!",
        emoji: "🤝",
        colorClass: "text-amber-400"
      };
    }
    
    if (winnerToken === 'X') {
      return {
        title: `${player1.username} Victorious!`,
        subtitle: `Masterful moves from Player 1`,
        emoji: player1.avatar,
        colorClass: player1.color
      };
    }

    // Token is 'O'
    if (mode === 'ai') {
      return {
        title: "CPU Opponent Won!",
        subtitle: "Better luck next time!",
        emoji: "🤖",
        colorClass: "text-violet-400"
      };
    }

    return {
      title: `${player2?.username || 'Player 2'} Victorious!`,
      subtitle: `Excellent placement from Player 2`,
      emoji: player2?.avatar || '👤',
      colorClass: player2?.color || 'text-cyan-400'
    };
  };

  const winNode = getWinnerNode();

  const calculateWinRate = (p: PlayerProfile) => {
    const total = p.stats.wins + p.stats.losses + p.stats.draws;
    if (total === 0) return 0;
    return Math.round((p.stats.wins / total) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Background radial highlight for winning bursts */}
      <div className="absolute w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <motion.div
        id="scorecard-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Absolute design accents */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />

        {/* Hero State (The Winner) */}
        <div className="text-center space-y-3 pt-2">
          {/* Winner Emoji/Avatar Burst */}
          <div className="relative inline-block">
            {winnerToken !== 'Draw' && (
              <motion.div
                initial={{ transform: 'scale(0.8)', opacity: 0 }}
                animate={{ transform: 'scale(1)', opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="absolute -top-3 -right-3 bg-amber-500 text-white rounded-full p-1.5 shadow-lg shadow-amber-500/30"
              >
                <Trophy size={16} fill="white" />
              </motion.div>
            )}
            <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center text-4xl border-2 border-slate-800 shadow-inner">
              {winNode.emoji}
            </div>
          </div>

          <div id="winner-hero-info">
            <h2 className={`text-2xl font-black tracking-tight ${winNode.colorClass}`}>
              {winNode.title}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {winNode.subtitle}
            </p>
          </div>
        </div>

        {/* Dynamic Game Match Metrics Log scorecard */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-850/60 grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="py-1">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-sans font-bold">Game Mode</span>
            <span className="text-white font-extrabold mt-0.5 block">
              {mode === 'ai' ? 'CPU AI' : 'Local'}
            </span>
          </div>
          <div className="py-1 border-x border-slate-850">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-sans font-bold">Moves Made</span>
            <span className="text-cyan-400 font-extrabold mt-0.5 block font-mono">{totalMoves} moves</span>
          </div>
          <div className="py-1">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-sans font-bold">Duration</span>
            <span className="text-amber-400 font-extrabold mt-0.5 block font-mono">{durationSeconds}s</span>
          </div>
        </div>

        {/* SIDE-BY-SIDE COMPETITOR SCORECARDS */}
        <div id="comparison-scorecards" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Player 1 Card */}
          <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-855 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-850">
              <span className="text-xl">{player1.avatar}</span>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${player1.color}`}>{player1.username}</h4>
                <p className="text-[9px] text-slate-550 font-mono">Spot 1 Record</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 text-center font-mono">
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                <span className="block text-[11px] text-slate-500 uppercase">Wins</span>
                <span className="text-sm text-white font-bold">{player1.stats.wins}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                <span className="block text-[11px] text-slate-500 uppercase">Rate</span>
                <span className="text-sm text-slate-400 font-bold">{calculateWinRate(player1)}%</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                <span className="block text-[11px] text-slate-500 uppercase flex items-center justify-center gap-0.5">
                  <Flame size={10} className="text-amber-500" />
                </span>
                <span className="text-sm text-amber-500 font-bold">{player1.stats.winStreak}</span>
              </div>
            </div>
          </div>

          {/* Player 2 Card (Or CPU) */}
          <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-855 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-850">
              <span className="text-xl">{mode === 'ai' ? '🤖' : (player2?.avatar || '👤')}</span>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${mode === 'ai' ? 'text-violet-400' : (player2?.color || 'text-cyan-400')}`}>
                  {mode === 'ai' ? 'CPU Opponent' : (player2?.username || 'Guest')}
                </h4>
                <p className="text-[9px] text-slate-550 font-mono">
                  {mode === 'ai' ? `Lvl: ${difficulty}` : 'Spot 2 Record'}
                </p>
              </div>
            </div>

            {mode === 'ai' ? (
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 flex items-center justify-center h-full min-h-[46px]">
                <p className="text-[10px] text-slate-500 text-center font-sans tracking-wide">
                  CPU levels reset each match. Try hard difficulty for a serious battle!
                </p>
              </div>
            ) : (
              player2 ? (
                <div className="grid grid-cols-3 gap-1 text-center font-mono">
                  <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                    <span className="block text-[11px] text-slate-500 uppercase">Wins</span>
                    <span className="text-sm text-white font-bold">{player2.stats.wins}</span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                    <span className="block text-[11px] text-slate-500 uppercase">Rate</span>
                    <span className="text-sm text-slate-400 font-bold">{calculateWinRate(player2)}%</span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                    <span className="block text-[11px] text-slate-500 uppercase flex items-center justify-center gap-0.5">
                      <Flame size={10} className="text-amber-500" />
                    </span>
                    <span className="text-sm text-amber-500 font-bold">{player2.stats.winStreak}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 flex items-center justify-center h-full min-h-[46px]">
                  <p className="text-[10px] text-slate-500 text-center font-sans tracking-wide">
                    Playing under Guest. Log in a profile in Spot 2 to save metrics side-by-side!
                  </p>
                </div>
              )
            )}
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div id="modal-actions" className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15 cursor-pointer text-sm"
          >
            <RefreshCw size={16} />
            <span>Rematch</span>
          </button>

          <button
            id="modal-dashboard-btn"
            onClick={onGoToDashboard}
            className="flex-1 py-3 px-4 bg-slate-850 hover:bg-slate-800 text-slate-205 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-750 cursor-pointer text-sm"
          >
            <LayoutDashboard size={16} />
            <span>Game Lobby</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
