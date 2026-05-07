import React from 'react';
import { soundManager } from '../lib/sound';
import { RetroButton } from '../components/RetroButton';

interface Props {
  changeScene: (scene: string) => void;
}

export default function MainMenu({ changeScene }: Props) {
  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <nav className="w-full md:w-80 lg:w-96 border-r-0 md:border-r-4 border-[#1a1a1a] flex flex-col p-8 md:p-12 gap-6 justify-center bg-[#080808]">
        <h1 className="font-retro text-6xl text-[var(--color-neon-cyan)] text-shadow-cyan mb-8 tracking-tighter md:hidden uppercase leading-none">
          AI ARCADE
        </h1>
        <div className="flex flex-col gap-4 w-full">
          <RetroButton onClick={() => changeScene('GAME_SELECT')}>Play</RetroButton>
          <RetroButton onClick={() => changeScene('STATS')}>Stats</RetroButton>
          <RetroButton onClick={() => changeScene('SETTINGS')}>Settings</RetroButton>
        </div>
      </nav>
      
      <div className="hidden md:flex flex-1 items-center justify-center relative flex-col">
        <div className="text-[12rem] leading-none mb-8 text-[#0a0a0a] text-shadow-cyan opacity-20 transform scale-110 select-none">
          🕹️
        </div>
        <p className="font-pixel text-3xl text-[var(--color-neon-lime)] blink uppercase tracking-widest mt-8">
          — INSERT COIN TO PLAY —
        </p>
      </div>
    </div>
  );
}
