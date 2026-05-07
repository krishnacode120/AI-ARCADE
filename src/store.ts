import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  musicVol: number;
  sfxVol: number;
  crtEnabled: boolean;
  theme: string;
  setMusicVol: (vol: number) => void;
  setSfxVol: (vol: number) => void;
  setCrtEnabled: (enabled: boolean) => void;
  setTheme: (theme: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      musicVol: 0.5,
      sfxVol: 0.8,
      crtEnabled: true,
      theme: 'default',
      setMusicVol: (vol) => set({ musicVol: vol }),
      setSfxVol: (vol) => set({ sfxVol: vol }),
      setCrtEnabled: (enabled) => set({ crtEnabled: enabled }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'arcade-settings' }
  )
);

type HighScoreEntry = { name: string; score: number; date: string };

interface StatsState {
  wins: number;
  losses: number;
  draws: number;
  snakeHighScore: number;
  simonHighScore: number;
  asteroidsHighScore: number;
  gamesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  
  // Leaderboards
  snakeLeaderboard: HighScoreEntry[];
  asteroidsLeaderboard: HighScoreEntry[];
  tetrisLeaderboard: HighScoreEntry[];

  addGameResult: (result: 'win' | 'loss' | 'draw') => void;
  updateSnakeScore: (score: number) => void;
  updateSimonScore: (score: number) => void;
  updateAsteroidsScore: (score: number) => void;
  addHighScore: (game: 'snake' | 'asteroids' | 'tetris', entry: HighScoreEntry) => void;
}

export const useStats = create<StatsState>()(
  persist(
    (set) => ({
      wins: 0,
      losses: 0,
      draws: 0,
      snakeHighScore: 0,
      simonHighScore: 0,
      asteroidsHighScore: 0,
      gamesPlayed: 0,
      currentStreak: 0,
      bestStreak: 0,
      snakeLeaderboard: [],
      asteroidsLeaderboard: [],
      tetrisLeaderboard: [],
      addGameResult: (result) => set((state) => {
        const newState = { 
            ...state, 
            gamesPlayed: state.gamesPlayed + 1,
        };
        if (result === 'win') {
            newState.wins += 1;
            newState.currentStreak += 1;
            if (newState.currentStreak > state.bestStreak) {
                newState.bestStreak = newState.currentStreak;
            }
        }
        if (result === 'loss') {
            newState.losses += 1;
            newState.currentStreak = 0;
        }
        if (result === 'draw') {
            newState.draws += 1;
        }
        return newState;
      }),
      updateSnakeScore: (score) => set((state) => ({
        snakeHighScore: Math.max(state.snakeHighScore, score)
      })),
      updateSimonScore: (score) => set((state) => ({
        simonHighScore: Math.max(state.simonHighScore, score)
      })),
      updateAsteroidsScore: (score) => set((state) => ({
        asteroidsHighScore: Math.max(state.asteroidsHighScore, score)
      })),
      addHighScore: (game, entry) => set((state) => {
          const key = `${game}Leaderboard` as const;
          const current = state[key] || [];
          const updated = [...current, entry].sort((a, b) => b.score - a.score).slice(0, 10);
          return { [key]: updated };
      })
    }),
    { name: 'arcade-stats' }
  )
);

interface GlobalUIState {
  isShaking: boolean;
  shakeScreen: () => void;
}

export const useGlobalUI = create<GlobalUIState>((set) => ({
  isShaking: false,
  shakeScreen: () => {
    set({ isShaking: true });
    setTimeout(() => set({ isShaking: false }), 500);
  }
}));
