import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile, GameMode, AIDifficulty, GameHistoryItem } from '../types';
import { Swords, Eye, ShieldAlert, Monitor, Users, ChevronRight, Award, History, Trophy, RotateCcw, TrendingUp, Flame } from 'lucide-react';

interface DashboardProps {
  signedInP1: PlayerProfile;
  signedInP2: PlayerProfile | null;
  players: PlayerProfile[];
  gameHistory: GameHistoryItem[];
  onStartGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
  onNavigateBackToAuth: () => void;
  onClearHistory: () => void;
  onResetStats: () => void;
}

export default function Dashboard({
  signedInP1,
  signedInP2,
  players,
  gameHistory,
  onStartGame,
  onNavigateBackToAuth,
  onClearHistory,
  onResetStats
}: DashboardProps) {
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'leaderboard' | 'history'>('leaderboard');

  // Sort players for leaderboard: Wins DESC, WinRate DESC, MaxStreak DESC
  const leaderboardPlayers = [...players].sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) {
      return b.stats.wins - a.stats.wins;
    }
    const aTotal = a.stats.wins + a.stats.losses + a.stats.draws || 1;
    const bTotal = b.stats.wins + b.stats.losses + b.stats.draws || 1;
    const aRate = (a.stats.wins / aTotal);
    const bRate = (b.stats.wins / bTotal);
    if (bRate !== aRate) {
      return bRate - aRate;
    }
    return b.stats.maxStreak - a.stats.maxStreak;
  });

  const getDifficultyColor = (diff: AIDifficulty) => {
    switch (diff) {
      case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const calculateWinRate = (p: PlayerProfile) => {
    const total = p.stats.wins + p.stats.losses + p.stats.draws;
    if (total === 0) return 0;
    return Math.round((p.stats.wins / total) * 100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto py-2 px-4 sm:px-6 w-full h-full">
      
      {/* LEFT COLUMN: Setup Game (Column ratio 5/12) */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-6 bg-slate-900 bg-opacity-40 border border-slate-800 rounded-2xl p-6">
        
        <div className="space-y-6">
          {/* Header & Change User */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{signedInP1.avatar}</span>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">Player 1</p>
                <h2 className={`text-lg font-extrabold ${signedInP1.color}`}>{signedInP1.username}</h2>
              </div>
            </div>
            
            <button
              id="change-profiles-btn"
              onClick={onNavigateBackToAuth}
              className="text-xs py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Sign In Menu
            </button>
          </div>

          {/* Quick Player 1 Stats Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div className="py-1">
              <span className="block text-xl font-extrabold text-white font-mono">{signedInP1.stats.wins}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Wins</span>
            </div>
            <div className="py-1 border-x border-slate-855/40">
              <span className="block text-xl font-extrabold text-slate-400 font-mono">{calculateWinRate(signedInP1)}%</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Win Rate</span>
            </div>
            <div className="py-1">
              <span className="block text-xl font-extrabold text-amber-500 font-mono flex items-center justify-center gap-0.5">
                <Flame size={14} className="animate-pulse" /> {signedInP1.stats.winStreak}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Streak</span>
            </div>
          </div>

          {/* MODE SELECTOR */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Choose Game Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {/* vs CPU */}
              <button
                id="mode-ai-btn"
                onClick={() => setMode('ai')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'ai'
                    ? 'border-violet-500/50 bg-violet-600/10 text-white shadow-md shadow-violet-500/5'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Monitor size={22} className={mode === 'ai' ? 'text-violet-400' : 'text-slate-500'} />
                <div className="text-center">
                  <span className="text-sm font-bold block">vs Opponent CPU</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Play against smart AI</span>
                </div>
              </button>

              {/* Local Pass-and-Play */}
              <button
                id="mode-local-btn"
                onClick={() => setMode('local')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'local'
                    ? 'border-cyan-500/50 bg-cyan-600/10 text-white shadow-md shadow-cyan-500/5'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Users size={22} className={mode === 'local' ? 'text-cyan-400' : 'text-slate-500'} />
                <div className="text-center">
                  <span className="text-sm font-bold block">Pass & Play</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">2 Players locally</span>
                </div>
              </button>
            </div>
          </div>

          {/* DYNAMIC SETTING SHEET */}
          <AnimatePresence mode="wait">
            {mode === 'ai' ? (
              <motion.div
                key="ai-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Difficulty</label>
                <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      id={`diff-${diff}-btn`}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        difficulty === diff
                          ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        diff === 'easy' ? 'bg-emerald-500' : diff === 'medium' ? 'bg-amber-505 bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {diff}
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-slate-950/45 rounded-lg border border-slate-850 text-xs text-slate-400 leading-relaxed font-mono">
                  {difficulty === 'easy' && "💡 Easy CPU: Plays randomly. Perfect for a warm-up!"}
                  {difficulty === 'medium' && "⚡ Medium CPU: Plays tactically. Blocks your wins and pushes for its own opportunities!"}
                  {difficulty === 'hard' && "🔥 Hard CPU: Unbeatable AI. Solves moves instantly via Minimax. Can you force a draw?"}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="local-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Competitor O Profile</label>
                <div className="p-4 bg-slate-950/65 rounded-xl border border-slate-855 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                      {signedInP2 ? signedInP2.avatar : "👤"}
                    </span>
                    <div>
                      {signedInP2 ? (
                        <>
                          <h4 className={`text-sm font-bold ${signedInP2.color}`}>{signedInP2.username}</h4>
                          <span className="text-[10px] text-slate-550 block font-mono">
                            W:{signedInP2.stats.wins} - L:{signedInP2.stats.losses} - D:{signedInP2.stats.draws}
                          </span>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold text-slate-300">Local Guest (O)</h4>
                          <span className="text-[10px] text-slate-500 block">Sign-in second spot to save stats</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!signedInP2 && (
                    <button
                      id="opt-login-p2-btn"
                      onClick={onNavigateBackToAuth}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 py-1.5 px-3 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      Add Player
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BATTLE ACTION BUTTON */}
        <div className="pt-6 border-t border-slate-800/80 mt-4">
          <button
            id="start-battle-btn"
            onClick={() => onStartGame(mode, mode === 'ai' ? difficulty : undefined)}
            className={`w-full py-4 rounded-xl text-md font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-lg cursor-pointer ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-t border-violet-400/20 text-white shadow-violet-500/10 hover:shadow-violet-500/20 hover:opacity-95'
                : 'bg-gradient-to-r from-cyan-600 to-teal-600 border-t border-cyan-400/20 text-white shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:opacity-95'
            }`}
          >
            <Swords size={20} />
            <span>Launch Duel</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Bento Stats & Leaderboards (Column ratio 7/12) */}
      <div className="lg:col-span-7 flex flex-col bg-slate-900 bg-opacity-30 border border-slate-800 rounded-2xl overflow-hidden h-full">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 p-1.5 bg-slate-950/50">
          <button
            id="tab-scores-btn"
            onClick={() => setActiveLeaderboardTab('leaderboard')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeLeaderboardTab === 'leaderboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Trophy size={14} className="text-amber-500" />
            <span>Local Scorecards ({players.length})</span>
          </button>
          <button
            id="tab-history-btn"
            onClick={() => setActiveLeaderboardTab('history')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeLeaderboardTab === 'history'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <History size={14} className="text-cyan-400" />
            <span>Duels Log ({gameHistory.length})</span>
          </button>
        </div>

        {/* TAB CORE */}
        <div className="p-6 flex-1 flex flex-col justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            
            {activeLeaderboardTab === 'leaderboard' ? (
              <motion.div
                key="scores-board"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex flex-col justify-between overflow-hidden space-y-4"
              >
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
                    <span>Rank & Competitor</span>
                    <div className="flex gap-8">
                      <span className="w-10 text-center">Score</span>
                      <span className="w-14 text-right">WinRate</span>
                    </div>
                  </div>

                  <div id="leaderboard-container" className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[350px]">
                    {leaderboardPlayers.map((p, idx) => {
                      const rank = idx + 1;
                      const winRate = calculateWinRate(p);
                      const isSelf = p.id === signedInP1.id || p.id === signedInP2?.id;

                      return (
                        <div
                          key={p.id}
                          id={`leaderboard-row-${p.username}`}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isSelf 
                              ? 'bg-gradient-to-r from-slate-900/80 to-indigo-950/20 border-indigo-500/20' 
                              : 'bg-slate-950/40 border-slate-850/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 text-sm font-mono font-extrabold text-center ${
                              rank === 1 ? 'text-amber-400 text-base' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                              {rank === 1 ? '👑' : `${rank}.`}
                            </span>
                            <span className="text-2xl">{p.avatar}</span>
                            <div>
                              <span className={`text-sm font-bold block ${p.color}`}>
                                {p.username}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                W {p.stats.wins} • L {p.stats.losses} • D {p.stats.draws}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-8 font-mono text-sm">
                            <span className="w-10 text-center font-bold text-white">{p.stats.wins}</span>
                            <span className="w-14 text-right font-medium text-slate-400">{winRate}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Board Action */}
                <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-600">
                  <p>Stats stored locally in browser storage</p>
                  <button
                    id="reset-stats-btn"
                    onClick={() => {
                      if (confirm("Are you sure you want to reset all local profiles' stats? (This will NOT delete profiles, only clear their scores to 0)")) {
                        onResetStats();
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reset Stats</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history-board"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col justify-between overflow-hidden space-y-4"
              >
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  {gameHistory.length === 0 ? (
                    <div id="no-history" className="text-center py-16 px-4 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl space-y-2 flex-1 flex flex-col items-center justify-center">
                      <p className="text-slate-500 font-mono text-xs italic">No duels registered yet.</p>
                      <p className="text-slate-600 text-[11px] max-w-xs">Play your first match to log match stats, turns, and outcomes here!</p>
                    </div>
                  ) : (
                    <div id="history-container" className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[350px]">
                      {gameHistory.map((h) => {
                        const isWin = h.winnerId !== 'draw';
                        const p1Won = h.winnerId === h.player1Id;
                        const p2Won = h.winnerId === h.player2Id || h.winnerId === 'cpu';

                        return (
                          <div
                            key={h.id}
                            id={`history-row-${h.id}`}
                            className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-300 font-bold">{h.player1Name}</span>
                                <span className="text-slate-600 text-[10px]">vs</span>
                                <span className="text-slate-300 font-bold">{h.player2Name}</span>
                                {h.difficulty && (
                                  <span className={`text-[9px] uppercase px-1 py-0.2 rounded-md font-sans font-bold border ${getDifficultyColor(h.difficulty)}`}>
                                    {h.difficulty}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-550 block mt-1">
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mode: {h.mode === 'ai' ? 'CPU AI' : 'Local'} • {h.totalMoves} moves
                              </span>
                            </div>

                            <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-0">
                              {h.winnerId === 'draw' ? (
                                <span className="text-amber-500 font-extrabold tracking-wide uppercase bg-amber-505/10 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10">
                                  DRAW
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-extrabold tracking-wide uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                                  {h.winnerName} Won
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 block mt-1">Time: {h.durationSeconds}s</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reset History Action */}
                {gameHistory.length > 0 && (
                  <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-600">
                    <p>Recent match limits set to top 40</p>
                    <button
                      id="clear-history-btn"
                      onClick={() => {
                        if (confirm("Are you sure you want to clear the entire combat logs database?")) {
                          onClearHistory();
                        }
                      }}
                      className="text-slate-500 hover:text-rose-450 text-rose-500/80 hover:text-rose-400 flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Clear Logs</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
