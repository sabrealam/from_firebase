import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile, GameMode, AIDifficulty, GameHistoryItem } from './types';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import GameBoard from './components/GameBoard';
import ScorecardModal from './components/ScorecardModal';
import { Github, Sparkles, Award, Play, Swords } from 'lucide-react';
import { db, auth, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';

const LOCAL_PROFILES_KEY = 'tictactoe_local_profiles';
const LOCAL_HISTORY_KEY = 'tictactoe_local_match_history';

// Hand-curated initial seed profiles to make the app interactive on first launch!
const SEED_PROFILES: PlayerProfile[] = [
  {
    id: 'seed-neonfox',
    username: 'Neon Fox',
    avatar: '🦊',
    color: 'text-violet-400',
    stats: { wins: 14, losses: 8, draws: 4, winStreak: 2, maxStreak: 5 },
    theme: 'violet',
    createdAt: Date.now() - 100000000
  },
  {
    id: 'seed-shadowninja',
    username: 'Shadow Ninja',
    avatar: '🥷',
    color: 'text-rose-450 text-rose-500',
    stats: { wins: 9, losses: 12, draws: 4, winStreak: 0, maxStreak: 3 },
    theme: 'rose',
    createdAt: Date.now() - 50000000
  },
  {
    id: 'seed-luckycat',
    username: 'Lucky Cat',
    avatar: '🐱',
    color: 'text-amber-500',
    stats: { wins: 5, losses: 3, draws: 2, winStreak: 1, maxStreak: 3 },
    theme: 'amber',
    createdAt: Date.now() - 25000000
  }
];

export default function App() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [signedInP1, setSignedInP1] = useState<PlayerProfile | null>(null);
  const [signedInP2, setSignedInP2] = useState<PlayerProfile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  
  // Navigation states
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'dashboard' | 'game'>('auth');
  
  // Game session states
  const [activeMatchSettings, setActiveMatchSettings] = useState<{ mode: GameMode; difficulty?: AIDifficulty } | null>(null);
  const [activeScorecard, setActiveScorecard] = useState<{
    winnerToken: 'X' | 'O' | 'Draw';
    durationSeconds: number;
    totalMoves: number;
  } | null>(null);

  // Key to force reset GameBoard component on rematch
  const [gameBoardKey, setGameBoardKey] = useState<number>(0);

  // 1. Validate Connection to Firestore on startup
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Real-time Sync of players from Firestore
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersList: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        playersList.push(doc.data() as PlayerProfile);
      });
      playersList.sort((a, b) => b.createdAt - a.createdAt);
      setPlayers(playersList);
    }, (error) => {
      console.warn("Firestore players sync listener warning. This is expected if rules deny access initially:", error);
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time Sync of games collection from Firestore
  useEffect(() => {
    const gamesRef = collection(db, 'games');
    const unsubscribe = onSnapshot(gamesRef, (snapshot) => {
      const gamesList: GameHistoryItem[] = [];
      snapshot.forEach((doc) => {
        gamesList.push(doc.data() as GameHistoryItem);
      });
      gamesList.sort((a, b) => b.timestamp - a.timestamp);
      setGameHistory(gamesList.slice(0, 40));
    }, (error) => {
      console.warn("Firestore games warning:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4. Track Firebase Auth State Changes & Sync Player 1 Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const playerRef = doc(db, 'players', firebaseUser.uid);
        try {
          const playerSnap = await getDoc(playerRef);
          if (playerSnap.exists()) {
            setSignedInP1(playerSnap.data() as PlayerProfile);
          } else {
            const defaultProfile: PlayerProfile = {
              id: firebaseUser.uid,
              username: firebaseUser.displayName?.slice(0, 15) || `Player ${firebaseUser.uid.slice(0, 5)}`,
              avatar: '🧙',
              color: 'text-violet-500',
              theme: 'slate',
              stats: { wins: 0, losses: 0, draws: 0, winStreak: 0, maxStreak: 0 },
              createdAt: Date.now()
            };
            await setDoc(playerRef, defaultProfile);
            setSignedInP1(defaultProfile);
          }
        } catch (error) {
          console.error("Failed to sync authenticated user profile", error);
        }
      } else {
        setSignedInP1(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile actions: Custom registration (Anonymous authentication)
  const handleCreateProfile = async (username: string, avatar: string, color: string): Promise<PlayerProfile> => {
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      const newProfile: PlayerProfile = {
        id: uid,
        username,
        avatar,
        color,
        theme: 'slate',
        stats: { wins: 0, losses: 0, draws: 0, winStreak: 0, maxStreak: 0 },
        createdAt: Date.now()
      };

      const playerRef = doc(db, 'players', uid);
      await setDoc(playerRef, newProfile);
      setSignedInP1(newProfile);
      return newProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'players');
    }
  };

  // Google Login Auth Trigger
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const playerRef = doc(db, 'players', firebaseUser.uid);
      const playerSnap = await getDoc(playerRef);
      if (!playerSnap.exists()) {
        const defaultProfile: PlayerProfile = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName?.slice(0, 15) || `Player ${firebaseUser.uid.slice(0, 5)}`,
          avatar: '⚡',
          color: 'text-cyan-500',
          theme: 'slate',
          stats: { wins: 0, losses: 0, draws: 0, winStreak: 0, maxStreak: 0 },
          createdAt: Date.now()
        };
        await setDoc(playerRef, defaultProfile);
        setSignedInP1(defaultProfile);
      } else {
        setSignedInP1(playerSnap.data() as PlayerProfile);
      }
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error("Google Sign-In failed:", error);
    }
  };

  const handleSignInPlayer = (player: PlayerProfile, spot: 1 | 2) => {
    if (spot === 1) {
      setSignedInP1(player);
    } else {
      setSignedInP2(player);
    }
  };

  const handleSignOutPlayer = async (spot: 1 | 2) => {
    if (spot === 1) {
      setSignedInP1(null);
      await signOut(auth);
    } else {
      setSignedInP2(null);
    }
  };

  const handleProceedToDashboard = () => {
    if (signedInP1) {
      setCurrentScreen('dashboard');
    }
  };

  const handleStartGame = (mode: GameMode, difficulty?: AIDifficulty) => {
    setActiveMatchSettings({ mode, difficulty });
    setGameBoardKey(prev => prev + 1);
    setCurrentScreen('game');
  };

  const handleQuitGame = () => {
    setActiveScorecard(null);
    setCurrentScreen('dashboard');
  };

  // Main game core outcome updater using Firestore
  const handleGameFinished = async (
    winnerToken: 'X' | 'O' | 'Draw', 
    durationSeconds: number, 
    totalMoves: number
  ) => {
    if (!signedInP1 || !activeMatchSettings) return;

    // 1. Compute and update Player 1 stats in Firestore
    const p1Stats = { ...signedInP1.stats };
    if (winnerToken === 'Draw') {
      p1Stats.draws += 1;
    } else if (winnerToken === 'X') {
      p1Stats.wins += 1;
      p1Stats.winStreak += 1;
      p1Stats.maxStreak = Math.max(p1Stats.maxStreak, p1Stats.winStreak);
    } else {
      p1Stats.losses += 1;
      p1Stats.winStreak = 0;
    }

    try {
      const p1Ref = doc(db, 'players', signedInP1.id);
      await updateDoc(p1Ref, { stats: p1Stats });
      setSignedInP1(prev => prev ? { ...prev, stats: p1Stats } : null);
    } catch (error) {
      console.warn("Could not save Player 1 stats in Firestore:", error);
    }

    // 2. Compute and update Player 2 stats in Firestore if Player 2 is signed in under our auth (standard safety filter)
    if (signedInP2 && auth.currentUser?.uid === signedInP2.id) {
      const p2Stats = { ...signedInP2.stats };
      if (winnerToken === 'Draw') {
        p2Stats.draws += 1;
      } else if (winnerToken === 'O') {
        p2Stats.wins += 1;
        p2Stats.winStreak += 1;
        p2Stats.maxStreak = Math.max(p2Stats.maxStreak, p2Stats.winStreak);
      } else {
        p2Stats.losses += 1;
        p2Stats.winStreak = 0;
      }
      try {
        const p2Ref = doc(db, 'players', signedInP2.id);
        await updateDoc(p2Ref, { stats: p2Stats });
        setSignedInP2(prev => prev ? { ...prev, stats: p2Stats } : null);
      } catch (error) {
        console.warn("Could not save Player 2 stats in Firestore:", error);
      }
    }

    // 3. Generate score/history log item
    let winnerName = 'Draw';
    let winnerId = 'draw';

    if (winnerToken === 'X') {
      winnerName = signedInP1.username;
      winnerId = signedInP1.id;
    } else if (winnerToken === 'O') {
      if (activeMatchSettings.mode === 'ai') {
        winnerName = 'CPU AI';
        winnerId = 'cpu';
      } else {
        winnerName = signedInP2?.username || 'Guest';
        winnerId = signedInP2?.id || 'guest';
      }
    }

    const gameId = 'game-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const gameHistoryItem: GameHistoryItem = {
      id: gameId,
      player1Id: signedInP1.id,
      player1Name: signedInP1.username,
      player2Id: activeMatchSettings.mode === 'ai' ? 'cpu' : (signedInP2?.id || 'guest'),
      player2Name: activeMatchSettings.mode === 'ai' ? 'CPU AI' : (signedInP2?.username || 'Guest'),
      winnerId,
      winnerName,
      mode: activeMatchSettings.mode,
      totalMoves,
      durationSeconds,
      timestamp: Date.now()
    };

    if (activeMatchSettings.difficulty) {
      gameHistoryItem.difficulty = activeMatchSettings.difficulty;
    }

    try {
      const gameRef = doc(db, 'games', gameId);
      await setDoc(gameRef, gameHistoryItem);
    } catch (error) {
      console.warn("Failed to record game match in Firestore:", error);
    }

    setActiveScorecard({
      winnerToken,
      durationSeconds,
      totalMoves
    });
  };

  const handlePlayAgain = () => {
    setActiveScorecard(null);
    setGameBoardKey(prev => prev + 1);
  };

  const handleGoToDashboard = () => {
    setActiveScorecard(null);
    setCurrentScreen('dashboard');
  };

  const handleClearHistory = () => {
    // Historical matches are recorded in Firestore immutably as per rules!
  };

  const handleResetStats = async () => {
    if (!signedInP1) return;
    try {
      const p1Ref = doc(db, 'players', signedInP1.id);
      const zeroStats = { wins: 0, losses: 0, draws: 0, winStreak: 0, maxStreak: 0 };
      await updateDoc(p1Ref, { stats: zeroStats });
      setSignedInP1(prev => prev ? { ...prev, stats: zeroStats } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'players/' + signedInP1.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Visual background ambient noise */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-slate-950 to-slate-950 -z-50 pointer-events-none" />

      {/* Primary Header Segment */}
      <header className="border-b border-slate-900 bg-slate-950/40 p-4 sticky top-0 backdrop-blur-md z-40 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-md border-t border-violet-400/20 shadow-md">
              X
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-600 flex items-center justify-center font-black text-white text-md border-t border-cyan-400/20 shadow-md">
              O
            </div>
            <span className="font-extrabold text-sm ml-1 tracking-tight text-white uppercase font-mono">Tic Tac Toe</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {signedInP1 && (
              <span className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-850">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className={signedInP1.color}>{signedInP1.username}</strong>
              </span>
            )}
            {signedInP2 && (
              <span className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-850">
                <strong className={signedInP2.color}>{signedInP2.username}</strong>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {currentScreen === 'auth' && (
            <motion.div
              key="auth-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <AuthScreen
                players={players}
                onSignInPlayer={handleSignInPlayer}
                onSignOutPlayer={handleSignOutPlayer}
                onCreateProfile={handleCreateProfile}
                signedInP1={signedInP1}
                signedInP2={signedInP2}
                onProceedToDashboard={handleProceedToDashboard}
                onGoogleSignIn={handleGoogleSignIn}
              />
            </motion.div>
          )}

          {currentScreen === 'dashboard' && signedInP1 && (
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Dashboard
                signedInP1={signedInP1}
                signedInP2={signedInP2}
                players={players}
                gameHistory={gameHistory}
                onStartGame={handleStartGame}
                onNavigateBackToAuth={() => setCurrentScreen('auth')}
                onClearHistory={handleClearHistory}
                onResetStats={handleResetStats}
              />
            </motion.div>
          )}

          {currentScreen === 'game' && signedInP1 && activeMatchSettings && (
            <motion.div
              key={`game-screen-${gameBoardKey}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <GameBoard
                player1={signedInP1}
                player2={signedInP2}
                mode={activeMatchSettings.mode}
                difficulty={activeMatchSettings.difficulty}
                onGameFinished={handleGameFinished}
                onQuitGame={handleQuitGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* END-OF-GAME MODAL SCORECARD OVERLAY */}
      <AnimatePresence>
        {activeScorecard && signedInP1 && activeMatchSettings && (
          <ScorecardModal
            winnerToken={activeScorecard.winnerToken}
            durationSeconds={activeScorecard.durationSeconds}
            totalMoves={activeScorecard.totalMoves}
            mode={activeMatchSettings.mode}
            difficulty={activeMatchSettings.difficulty}
            player1={signedInP1}
            player2={signedInP2}
            onPlayAgain={handlePlayAgain}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </AnimatePresence>

      {/* Footer Segment */}
      <footer className="border-t border-slate-900 py-6 px-4 bg-slate-950/60 font-mono text-[10px] text-slate-600 text-center select-none">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Tic Tac Toe Arena — Absolute Pure Local Sandbox</p>
          <div className="flex gap-4">
            <span>Powered by React & Framer Motion</span>
            <span>Ref: {Date.now().toString().slice(0, 10)}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
