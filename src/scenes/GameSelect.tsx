import React from 'react';
import { RetroButton } from '../components/RetroButton';

interface Props {
  changeScene: (scene: string) => void;
  selectGame: (game: string) => void;
}

export default function GameSelect({ changeScene, selectGame }: Props) {
  const games = [
    { id: 'TIC_TAC_TOE', name: 'TIC TAC TOE', number: '01', desc: 'The classic logic grid. Challenge the neural-minimax AI or a local friend.', diff: 'HARD' },
    { id: 'CONNECT4', name: 'CONNECT 4', number: '02', desc: 'Vertical gravity-based strategy. Drop discs and block the computer path.', diff: 'NORMAL' },
    { id: 'SNAKE', name: 'SNAKE', number: '03', desc: 'Fast-paced reflex challenge. Grow your tail, avoid the walls.', diff: 'EXPERT' },
    { id: 'DOTS_BOXES', name: 'DOTS & BOXES', number: '04', desc: 'Claim territory and dominate the board. A game of lines and patience.', diff: 'EASY' },
    { id: 'PONG', name: 'PONG', number: '05', desc: 'The pioneer of interactive entertainment. Deflect the signal, score the point.', diff: 'NORMAL' },
    { id: 'SIMON', name: 'SIMON SAYS', number: '06', desc: 'Test your working memory. Repeat the expanding light and sound sequence.', diff: 'DYNAMIC' },
    { id: 'MINESWEEPER', name: 'MINESWEEPER', number: '07', desc: 'Deductive logic spatial reasoning. Clear the safe sectors, avoid the bombs.', diff: 'HARD' },
    { id: 'MEMORY', name: 'MEMORY MATCH', number: '08', desc: 'Find pairs of hidden symbols to clear the board in minimum moves.', diff: 'EASY' },
    { id: 'ASTEROIDS', name: 'ASTEROIDS', number: '09', desc: 'Space combat and survival. Blast asteroids, dodge debris, survive.', diff: 'NORMAL' },
    { id: 'TETRIS', name: 'TETRIS', number: '10', desc: 'Geometry puzzle optimization. Clear lines by organizing falling blocks.', diff: 'NORMAL' }
  ];

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-6 md:p-10 relative">
      <div className="mb-4 flex items-baseline gap-4 mt-2 md:mt-0">
        <h2 className="text-3xl lg:text-4xl text-[var(--color-neon-magenta)] text-shadow-magenta uppercase">Select Game</h2>
        <span className="h-1 flex-1 border-b-2 border-dashed border-[#333]"></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pb-24 pr-2">
        {games.map(g => (
          <div
            key={g.id}
            onClick={() => selectGame(g.id)}
            className="border-2 lg:border-4 border-[#333] p-4 flex flex-col bg-[#0f0f0f] relative group transition-all cursor-pointer hover:border-[var(--color-neon-magenta)] hover:shadow-[inset_0_0_20px_var(--color-neon-magenta)] min-h-[160px] lg:min-h-[220px]"
          >
            <div className="absolute top-2 right-2 text-[var(--color-neon-lime)] text-sm lg:text-lg">{g.number}</div>
            <h3 className="font-pixel text-xl lg:text-2xl text-[var(--color-neon-cyan)] mb-2 uppercase select-none">{g.name}</h3>
            <p className="font-pixel text-xs lg:text-sm opacity-60 leading-tight mb-4 uppercase select-none">{g.desc}</p>
            <div className="mt-auto flex justify-between items-center w-full">
              <span className="text-[var(--color-neon-lime)] text-[10px] lg:text-xs font-pixel select-none">[{g.diff}]</span>
              <span className="text-[var(--color-neon-magenta)] text-xs lg:text-sm font-pixel group-hover:visible invisible select-none">START</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 w-48">
        <RetroButton onClick={() => changeScene('MENU')}>BACK TO MENU</RetroButton>
      </div>
    </div>
  );
}
