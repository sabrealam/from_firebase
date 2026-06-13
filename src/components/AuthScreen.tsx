import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile } from '../types';
import { User, UserPlus, Play, KeyRound, Check, Award, Flame, LogOut, ChevronRight } from 'lucide-react';

export const AVATAR_PRESETS = ["🦊", "🐱", "🐯", "🦖", "🦄", "🐉", "🧙", "🥷", "👾", "🚀", "🛸", "🔮", "⚡", "🦁", "🐼", "🔥"];

export const ACCENT_COLORS = [
  { name: "Rose", text: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500", glow: "shadow-rose-500/20", lightBg: "bg-rose-500/10" },
  { name: "Amber", text: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500", glow: "shadow-amber-500/20", lightBg: "bg-amber-500/10" },
  { name: "Emerald", text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500", glow: "shadow-emerald-500/20", lightBg: "bg-emerald-500/10" },
  { name: "Cyan", text: "text-cyan-500", bg: "bg-cyan-500", border: "border-cyan-500", glow: "shadow-cyan-500/20", lightBg: "bg-cyan-500/10" },
  { name: "Violet", text: "text-violet-500", bg: "bg-violet-500", border: "border-violet-500", glow: "shadow-violet-500/20", lightBg: "bg-violet-500/10" },
  { name: "Pink", text: "text-pink-500", bg: "bg-pink-500", border: "border-pink-500", glow: "shadow-pink-500/20", lightBg: "bg-pink-500/10" },
  { name: "Indigo", text: "text-indigo-500", bg: "bg-indigo-500", border: "border-indigo-500", glow: "shadow-indigo-500/20", lightBg: "bg-indigo-500/10" }
];

interface AuthScreenProps {
  players: PlayerProfile[];
  onSignInPlayer: (player: PlayerProfile, spot: 1 | 2) => void;
  onSignOutPlayer: (spot: 1 | 2) => void;
  onCreateProfile: (username: string, avatar: string, color: string) => Promise<PlayerProfile>;
  signedInP1: PlayerProfile | null;
  signedInP2: PlayerProfile | null;
  onProceedToDashboard: () => void;
  onGoogleSignIn: () => Promise<void>;
}

export default function AuthScreen({
  players,
  onSignInPlayer,
  onSignOutPlayer,
  onCreateProfile,
  signedInP1,
  signedInP2,
  onProceedToDashboard,
  onGoogleSignIn
}: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'login'>('create');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedColor, setSelectedColor] = useState(ACCENT_COLORS[4]); // default violet
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Spot 1 or 2 currently being selected for sign in
  const [activeSelectorSpot, setActiveSelectorSpot] = useState<1 | 2>(1);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = username.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a username.");
      return;
    }
    if (trimmedName.length > 15) {
      setErrorMessage("Username must be 15 characters or less.");
      return;
    }

    // Check duplicate
    const exists = players.some(p => p.username.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setErrorMessage("Username already exists. Please choose another or Sign In!");
      return;
    }

    try {
      const newProfile = await onCreateProfile(trimmedName, selectedAvatar, selectedColor.text);
      setSuccessMessage(`Profile for "${newProfile.username}" created successfully!`);
      
      // Auto sign into active selector spot
      onSignInPlayer(newProfile, activeSelectorSpot);
      
      // Reset form
      setUsername('');
      // If we signed in P1, maybe flip selector to P2
      if (activeSelectorSpot === 1) {
        setActiveSelectorSpot(2);
      }
    } catch (err: any) {
      setErrorMessage("Failed to create profile: " + String(err));
    }
  };

  const handleQuickSignIn = (player: PlayerProfile) => {
    // Check if player already signed in to the other spot
    if (activeSelectorSpot === 1 && signedInP2?.id === player.id) {
      setErrorMessage("This player is already signed in as Player 2!");
      return;
    }
    if (activeSelectorSpot === 2 && signedInP1?.id === player.id) {
      setErrorMessage("This player is already signed in as Player 1!");
      return;
    }

    onSignInPlayer(player, activeSelectorSpot);
    setErrorMessage('');
    
    // Switch active slot for convenience
    if (activeSelectorSpot === 1) {
      setActiveSelectorSpot(2);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center max-w-6xl mx-auto py-4 px-4 sm:px-6 w-full h-full min-h-[500px]">
      
      {/* LEFT COLUMN: Active Sign-In Status Cards */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between gap-6 bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800">
        <div>
          <div className="space-y-1 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white select-none">
              Tic Tac Toe
            </h1>
            <p className="text-slate-400 text-sm">
              Sign in to track your scores, climb the leaderboard, and unlock stats!
            </p>
          </div>

          <div className="space-y-4">
            {/* Player 1 Selection Status */}
            <div 
              id="p1-selector-card"
              onClick={() => setActiveSelectorSpot(1)}
              className={`p-4 rounded-xl border relative cursor-pointer transition-all duration-300 ${
                activeSelectorSpot === 1 
                  ? 'border-violet-500/50 bg-slate-800/40 ring-1 ring-violet-500/30' 
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/30'
              }`}
            >
              <div className="absolute top-3 right-3 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Spot 1 (X)
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl relative shadow-inner ${
                  signedInP1 ? 'bg-slate-800' : 'bg-slate-900 border border-dashed border-slate-700'
                }`}>
                  {signedInP1 ? signedInP1.avatar : "👤"}
                  {activeSelectorSpot === 1 && (
                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-violet-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-405 text-white">Player 1 (Primary)</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {signedInP1 ? (
                      <>
                        <span className={`text-md font-bold ${signedInP1.color}`}>{signedInP1.username}</span>
                        <button 
                          id="p1-signout-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSignOutPlayer(1);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 ml-2 transition-colors cursor-pointer"
                        >
                          <LogOut size={12} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No player selected (Click to assign)</span>
                    )}
                  </div>
                </div>
              </div>
              {signedInP1 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-4 gap-1 text-center text-[11px] text-slate-400 font-mono">
                  <div>
                    <span className="block text-white font-bold">{signedInP1.stats.wins}</span> Wins
                  </div>
                  <div>
                    <span className="block text-white font-bold">{signedInP1.stats.losses}</span> Losses
                  </div>
                  <div>
                    <span className="block text-white font-bold">{signedInP1.stats.draws}</span> Draws
                  </div>
                  <div>
                    <span className="block text-white font-bold flex items-center justify-center gap-0.5">
                      <Flame size={10} className="text-amber-500" /> {signedInP1.stats.winStreak}
                    </span> Streak
                  </div>
                </div>
              )}
            </div>

            {/* Player 2 Selection Status */}
            <div 
              id="p2-selector-card"
              onClick={() => setActiveSelectorSpot(2)}
              className={`p-4 rounded-xl border relative cursor-pointer transition-all duration-300 ${
                activeSelectorSpot === 2 
                  ? 'border-cyan-500/50 bg-slate-800/40 ring-1 ring-cyan-500/30' 
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/30'
              }`}
            >
              <div className="absolute top-3 right-3 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Spot 2 (O)
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl relative shadow-inner ${
                  signedInP2 ? 'bg-slate-800' : 'bg-slate-900 border border-dashed border-slate-700'
                }`}>
                  {signedInP2 ? signedInP2.avatar : "🤖"}
                  {activeSelectorSpot === 2 && (
                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-405 text-white">Player 2 (Opponent)</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {signedInP2 ? (
                      <>
                        <span className={`text-md font-bold ${signedInP2.color}`}>{signedInP2.username}</span>
                        <button 
                          id="p2-signout-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSignOutPlayer(2);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 ml-2 transition-colors cursor-pointer"
                        >
                          <LogOut size={12} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Optional. If empty, plays against CPU!</span>
                    )}
                  </div>
                </div>
              </div>
              {signedInP2 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-4 gap-1 text-center text-[11px] text-slate-400 font-mono">
                  <div>
                    <span className="block text-white font-bold">{signedInP2.stats.wins}</span> Wins
                  </div>
                  <div>
                    <span className="block text-white font-bold">{signedInP2.stats.losses}</span> Losses
                  </div>
                  <div>
                    <span className="block text-white font-bold">{signedInP2.stats.draws}</span> Draws
                  </div>
                  <div>
                    <span className="block text-white font-bold flex items-center justify-center gap-0.5">
                      <Flame size={10} className="text-amber-500" /> {signedInP2.stats.winStreak}
                    </span> Streak
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            id="proceed-game-btn"
            disabled={!signedInP1}
            onClick={onProceedToDashboard}
            className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg ${
              signedInP1 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-500/20 active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            {signedInP1 ? (
              <>
                <span>Enter Game Lobby</span>
                <Play size={18} fill="currentColor" />
              </>
            ) : (
              <span>Sign in Player 1 to Start</span>
            )}
          </button>
          {!signedInP1 && (
            <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col gap-3">
              <p className="text-center text-xs text-slate-500">
                Select or create a Player 1 profile to proceed
              </p>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/50"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-800/50"></div>
              </div>
              <button
                id="google-signin-btn"
                onClick={onGoogleSignIn}
                type="button"
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 hover:bg-slate-900/60 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Tab Panel (Sign In - Select Profile / Create Profile) */}
      <div className="w-full lg:w-7/12 flex flex-col bg-slate-900 bg-opacity-30 rounded-2xl border border-slate-800 overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            id="tab-create-btn"
            onClick={() => {
              setActiveTab('create');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create' 
                ? 'bg-slate-800 text-violet-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={16} />
            <span>Create Profile</span>
          </button>
          <button
            id="tab-login-btn"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'login' 
                ? 'bg-slate-800 text-cyan-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound size={16} />
            <span>Sign In ({players.length})</span>
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {activeTab === 'create' ? (
              <motion.form 
                key="create-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleCreate}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div id="create-profile-form" className="space-y-5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="text-violet-500" size={18} />
                    <h2 className="text-lg font-bold text-white">Create New Profile</h2>
                  </div>

                  {errorMessage && (
                    <div id="create-error" className="py-2.5 px-4 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-lg text-xs leading-relaxed animate-fade-in">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div id="create-success" className="py-2.5 px-4 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs leading-relaxed animate-fade-in">
                      {successMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</label>
                    <input
                      id="username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g., StarLord"
                      maxLength={15}
                      className="w-full bg-slate-950 border border-slate-800 leading-snug rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Avatar Emoji</label>
                    <div className="grid grid-cols-8 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                      {AVATAR_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          id={`avatar-${emoji}`}
                          type="button"
                          onClick={() => setSelectedAvatar(emoji)}
                          className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                            selectedAvatar === emoji 
                              ? 'bg-violet-600/20 border border-violet-500/60 scale-105' 
                              : 'bg-slate-900 border border-transparent'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Profile Accent Color</label>
                    <div className="flex flex-wrap gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.name}
                          id={`color-${color.name}`}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                            selectedColor.name === color.name 
                              ? `${color.lightBg} ${color.border} ${color.text} font-bold scale-102` 
                              : 'bg-slate-900 border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-850 mt-4">
                  <button
                    id="submit-create-btn"
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 active:scale-98 text-white rounded-xl font-bold transition-all text-sm cursor-pointer shadow-lg shadow-violet-500/10"
                  >
                    Create Profile & Assign to Spot {activeSelectorSpot}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="login-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1 flex flex-col justify-between h-full"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div id="p-list-title" className="flex items-center gap-2">
                      <Award className="text-cyan-500" size={18} />
                      <h2 className="text-lg font-bold text-white">Select a Profile to Sign In</h2>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md font-mono">
                      Assigning to Spot {activeSelectorSpot}
                    </span>
                  </div>

                  {errorMessage && (
                    <div id="login-error" className="py-2.5 px-4 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-lg text-xs leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  {players.length === 0 ? (
                    <div id="no-profiles" className="text-center py-12 px-4 bg-slate-950/40 border border-dashed border-slate-850 rounded-xl space-y-3">
                      <p className="text-slate-500 text-sm italic">
                        No profiles found on this browser. Create a new one!
                      </p>
                      <button
                        id="go-create-btn"
                        onClick={() => setActiveTab('create')}
                        className="text-xs text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        Create your first profile <ChevronRight size={12} />
                      </button>
                    </div>
                  ) : (
                    <div id="profiles-list-container" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                      {players.map((player) => {
                        const isP1 = signedInP1?.id === player.id;
                        const isP2 = signedInP2?.id === player.id;
                        const isCurrentlyAssigned = isP1 || isP2;
                        
                        return (
                          <div
                            key={player.id}
                            id={`profile-card-${player.username}`}
                            onClick={() => !isCurrentlyAssigned && handleQuickSignIn(player)}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all group ${
                              isCurrentlyAssigned 
                                ? 'bg-slate-955 opacity-60 border-slate-800/50 cursor-not-allowed' 
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/40 hover:border-slate-700 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                {player.avatar}
                              </span>
                              <div className="text-left">
                                <span className={`text-sm font-bold block leading-tight ${player.color}`}>
                                  {player.username}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  W:{player.stats.wins} - L:{player.stats.losses} - D:{player.stats.draws}
                                </span>
                              </div>
                            </div>

                            {isCurrentlyAssigned ? (
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isP1 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                                {isP1 ? 'Spot 1' : 'Spot 2'}
                              </span>
                            ) : (
                              <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                                <Check size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-850 text-center text-xs text-slate-500">
                  Click any profile card above to assign it to the selected spot (Currently editing <strong className="text-slate-300">Spot {activeSelectorSpot}</strong>)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
