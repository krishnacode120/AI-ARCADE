import React, { useState } from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';
import { useStats } from '../store';

interface Props {
  changeScene: (scene: string) => void;
}

export default function Stats({ changeScene }: Props) {
  const { wins, losses, draws, snakeHighScore, simonHighScore, asteroidsHighScore, gamesPlayed, currentStreak, bestStreak, snakeLeaderboard, asteroidsLeaderboard, tetrisLeaderboard } = useStats();
  
  const [tab, setTab] = useState<'stats'|'snake'|'asteroids'|'tetris'>('stats');

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 md:p-8 relative">
      <h1 className="font-retro text-4xl text-gray-200 mb-8 text-center pt-10 md:pt-0 pb-2">
        STATISTICS & LEADERBOARDS
      </h1>
      
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-6 max-w-full">
         <RetroButton active={tab === 'stats'} className="text-xl px-2 py-1" onClick={() => setTab('stats')}>STATS</RetroButton>
         <RetroButton active={tab === 'tetris'} className="text-xl px-2 py-1" onClick={() => setTab('tetris')}>TETRIS</RetroButton>
         <RetroButton active={tab === 'snake'} className="text-xl px-2 py-1" onClick={() => setTab('snake')}>SNAKE</RetroButton>
         <RetroButton active={tab === 'asteroids'} className="text-xl px-2 py-1" onClick={() => setTab('asteroids')}>ASTEROIDS</RetroButton>
      </div>
      
      {tab === 'stats' && (
      <Panel className="w-full max-w-2xl font-pixel text-xl md:text-2xl mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">GAMES PLAYED:</span>
          <span className="text-white">{gamesPlayed}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">WINS:</span>
          <span className="text-[var(--color-neon-lime)]">{wins}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">LOSSES:</span>
          <span className="text-[var(--color-neon-magenta)]">{losses}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-400">DRAWS:</span>
          <span className="text-gray-200">{draws}</span>
        </div>
        
        <div className="flex justify-between mt-6 pt-6 border-t-2 border-gray-800">
          <span className="text-gray-400">CURRENT WIN STREAK:</span>
          <span className="text-[var(--color-neon-lime)]">{currentStreak}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">BEST WIN STREAK:</span>
          <span className="text-[var(--color-neon-cyan)]">{bestStreak}</span>
        </div>

        <div className="flex justify-between mt-6 pt-6 border-t-2 border-gray-800">
          <span className="text-gray-400">SIMON HIGH SCORE:</span>
          <span className="text-[var(--color-neon-magenta)]">{simonHighScore}</span>
        </div>
      </Panel>
      )}

      {tab !== 'stats' && (
      <Panel className="w-full max-w-2xl font-pixel text-xl md:text-2xl mb-8 min-h-[300px]">
         <div className="flex border-b border-gray-700 pb-2 mb-4 text-gray-400 uppercase tracking-widest text-sm md:text-lg">
             <div className="w-16">RANK</div>
             <div className="flex-1">NAME</div>
             <div className="w-32 text-right">SCORE</div>
         </div>
         
         {tab === 'tetris' && tetrisLeaderboard.map((entry, idx) => (
             <div key={idx} className="flex border-b border-gray-900 py-2 text-[var(--color-neon-cyan)] hover:bg-white/5 transition-all">
                 <div className="w-16">#{idx + 1}</div>
                 <div className="flex-1">{entry.name}</div>
                 <div className="w-32 text-right">{entry.score}</div>
             </div>
         ))}
         {tab === 'tetris' && tetrisLeaderboard.length === 0 && <div className="text-center text-gray-500 mt-8">NO DATA FOUND</div>}

         {tab === 'snake' && snakeLeaderboard.map((entry, idx) => (
             <div key={idx} className="flex border-b border-gray-900 py-2 text-[var(--color-neon-lime)] hover:bg-white/5 transition-all">
                 <div className="w-16">#{idx + 1}</div>
                 <div className="flex-1">{entry.name}</div>
                 <div className="w-32 text-right">{entry.score}</div>
             </div>
         ))}
         {tab === 'snake' && snakeLeaderboard.length === 0 && <div className="text-center text-gray-500 mt-8">NO DATA FOUND</div>}

         {tab === 'asteroids' && asteroidsLeaderboard.map((entry, idx) => (
             <div key={idx} className="flex border-b border-gray-900 py-2 text-[#FFD700] hover:bg-white/5 transition-all">
                 <div className="w-16">#{idx + 1}</div>
                 <div className="flex-1">{entry.name}</div>
                 <div className="w-32 text-right">{entry.score}</div>
             </div>
         ))}
         {tab === 'asteroids' && asteroidsLeaderboard.length === 0 && <div className="text-center text-gray-500 mt-8">NO DATA FOUND</div>}
      </Panel>
      )}
      
      <div className="mt-4 self-center md:self-start">
        <RetroButton onClick={() => changeScene('MENU')}>BACK MENU</RetroButton>
      </div>
    </div>
  );
}
