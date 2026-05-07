import React, { useState, useEffect } from 'react';
import { soundManager } from './lib/sound';
import MainMenu from './scenes/MainMenu';
import GameSelect from './scenes/GameSelect';
import GameSetup from './scenes/GameSetup';
import Settings from './scenes/Settings';
import Stats from './scenes/Stats';
import TicTacToe from './games/TicTacToe';
import Connect4 from './games/Connect4';
import Snake from './games/Snake';
import DotsBoxes from './games/DotsBoxes';
import Pong from './games/Pong';
import Simon from './games/Simon';
import Minesweeper from './games/Minesweeper';
import Memory from './games/Memory';
import Asteroids from './games/Asteroids';
import Tetris from './games/Tetris';
import { useGlobalUI, useSettings } from './store';
import Starfield from './components/Starfield';

export default function App() {
  const [scene, setScene] = useState('MENU');
  const [selectedGame, setSelectedGame] = useState('');
  const [gameConfig, setGameConfig] = useState({ players: 1, difficulty: 'Normal' });
  const { isShaking } = useGlobalUI();
  const { theme, crtEnabled } = useSettings();

  useEffect(() => {
    // Initialize sound context on first interaction
    const initSound = () => soundManager.init();
    document.addEventListener('click', initSound, { once: true });
    return () => document.removeEventListener('click', initSound);
  }, []);

  const renderScene = () => {
    switch (scene) {
      case 'MENU':
        return <MainMenu changeScene={setScene} />;
      case 'GAME_SELECT':
        return <GameSelect changeScene={setScene} selectGame={(g) => { setSelectedGame(g); setScene('GAME_SETUP'); }} />;
      case 'GAME_SETUP':
        return <GameSetup game={selectedGame} changeScene={setScene} startGame={(config) => { setGameConfig(config); setScene(selectedGame); }} />;
      case 'SETTINGS':
        return <Settings changeScene={setScene} />;
      case 'STATS':
        return <Stats changeScene={setScene} />;
      case 'TIC_TAC_TOE':
        return <TicTacToe config={gameConfig} changeScene={setScene} />;
      case 'CONNECT4':
        return <Connect4 config={gameConfig} changeScene={setScene} />;
      case 'SNAKE':
        return <Snake config={gameConfig} changeScene={setScene} />;
      case 'DOTS_BOXES':
        return <DotsBoxes config={gameConfig} changeScene={setScene} />;
      case 'PONG':
        return <Pong config={gameConfig} changeScene={setScene} />;
      case 'SIMON':
        return <Simon changeScene={setScene} />;
      case 'MINESWEEPER':
        return <Minesweeper config={gameConfig} changeScene={setScene} />;
      case 'MEMORY':
        return <Memory config={gameConfig} changeScene={setScene} />;
      case 'ASTEROIDS':
        return <Asteroids config={gameConfig} changeScene={setScene} />;
      case 'TETRIS':
        return <Tetris config={gameConfig} changeScene={setScene} />;
      default:
        return <MainMenu changeScene={setScene} />;
    }
  };

  return (
    <div className={`h-full w-full bg-[var(--color-arcade-bg)] text-[#f0f0f0] overflow-hidden flex flex-col relative font-pixel select-none theme-${theme} ${isShaking ? 'shake-screen' : ''}`}>
      <Starfield />
      {crtEnabled && <div className="crt-overlay"></div>}
      <div className="vignette"></div>
      
      <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-12 border-b-4 border-[#1a1a1a] relative z-20 shrink-0 bg-[#080808]">
        <div className="flex items-center gap-4">
          <div className="hidden md:block w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-magenta)] rounded-sm"></div>
          <h1 className="text-5xl md:text-6xl tracking-widest text-[var(--color-neon-cyan)] text-shadow-cyan uppercase font-retro m-0">AI ARCADE</h1>
        </div>
        <div className="text-right">
          <p className="text-xl md:text-2xl text-[var(--color-neon-lime)] mb-1 italic">INSERT COINS: 99</p>
          <p className="hidden md:block text-sm opacity-50 uppercase tracking-widest text-[#f0f0f0]">v 1.3.0 - EXPANDED EDITION</p>
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="h-full w-full">
          {renderScene()}
        </div>
      </main>

      <footer className="h-10 md:h-12 bg-[#111] border-t-2 border-[#333] flex items-center justify-between px-4 md:px-8 relative z-10 shrink-0">
        <div className="flex gap-4 md:gap-8 hidden sm:flex">
          <div className="flex gap-2 md:gap-4">
            <span className="text-[var(--color-neon-magenta)] uppercase text-sm md:text-base">CPU LOAD:</span>
            <span className="text-[var(--color-neon-lime)] text-sm md:text-base">24%</span>
          </div>
          <div className="flex gap-2 md:gap-4 border-l-2 border-[#333] pl-4 md:pl-8">
            <span className="text-[var(--color-neon-magenta)] uppercase text-sm md:text-base">SYSTEM:</span>
            <span className="text-[var(--color-neon-cyan)] text-sm md:text-base">NOMINAL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-neon-lime)] blink"></div>
          <span className="text-[var(--color-neon-lime)] uppercase tracking-tighter text-sm md:text-base">Connected to Arcade.Network</span>
        </div>
      </footer>
    </div>
  );
}
