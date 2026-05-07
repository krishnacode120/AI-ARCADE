import React, { useState, useEffect, useRef } from 'react';
import { RetroButton } from '../components/RetroButton';
import { useStats, useGlobalUI } from '../store';
import { soundManager } from '../lib/sound';

interface Props {
  changeScene: (scene: string) => void;
}

export default function Simon({ changeScene }: Props) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [playingSeq, setPlayingSeq] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const { updateSimonScore } = useStats();
  const { shakeScreen } = useGlobalUI();

  const colors = [
    { id: 0, color: 'bg-red-500', active: 'bg-red-300 shadow-[0_0_30px_red]', freq: 261.63 }, // C4
    { id: 1, color: 'bg-blue-500', active: 'bg-blue-300 shadow-[0_0_30px_blue]', freq: 329.63 }, // E4
    { id: 2, color: 'bg-green-500', active: 'bg-green-300 shadow-[0_0_30px_green]', freq: 392.00 }, // G4
    { id: 3, color: 'bg-yellow-500', active: 'bg-yellow-300 shadow-[0_0_30px_yellow]', freq: 523.25 }  // C5
  ];

  const playTone = (freq: number) => {
    soundManager.playTone(freq, 'sine', 0.5, 0.1);
  };

  const nextRound = () => {
    const nextBtn = Math.floor(Math.random() * 4);
    setSequence(prev => [...prev, nextBtn]);
    setPlayerSeq([]);
  };

  useEffect(() => {
    if (sequence.length > 0) {
      setPlayingSeq(true);
      let i = 0;
      const interval = setInterval(() => {
        if (i < sequence.length) {
          const btnId = sequence[i];
          setActiveBtn(btnId);
          playTone(colors[btnId].freq);
          setTimeout(() => setActiveBtn(null), 400); // Active for 400ms
          i++;
        } else {
          setPlayingSeq(false);
          clearInterval(interval);
        }
      }, 700); // Wait 700ms between notes
      return () => clearInterval(interval);
    } else if (!gameOver) {
       // Start first round
       setTimeout(nextRound, 1000);
    }
  }, [sequence]); // eslint-disable-line

  const handleBtnClick = (id: number) => {
    if (playingSeq || gameOver) return;
    
    playTone(colors[id].freq);
    setActiveBtn(id);
    setTimeout(() => setActiveBtn(null), 200);

    const newPlayerSeq = [...playerSeq, id];
    setPlayerSeq(newPlayerSeq);

    if (sequence[newPlayerSeq.length - 1] !== id) {
      // Wrong choice
      setGameOver(true);
      soundManager.loss();
      shakeScreen();
      updateSimonScore(sequence.length - 1);
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      // Correct! Next round.
      setTimeout(nextRound, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 w-full">
      <div className="flex justify-between w-full mb-8 mt-4 items-center">
        <h2 className="text-3xl text-[var(--color-neon-magenta)] text-shadow-magenta">SIMON SAYS</h2>
        <span className="text-xl text-[var(--color-neon-lime)]">SCORE: {Math.max(0, sequence.length - 1)}</span>
      </div>

      <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] grid grid-cols-2 grid-rows-2 gap-4 bg-[#111] p-4 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border-8 border-gray-800 shrink-0">
        <div className="absolute inset-0 m-auto w-1/4 h-1/4 bg-[#111] rounded-full z-10 flex items-center justify-center border-4 border-gray-800">
           <span className="text-[var(--color-neon-cyan)] text-2xl font-bold">{sequence.length}</span>
        </div>
        {colors.map((c, index) => {
          let borderRadius = '';
          if (index === 0) borderRadius = 'rounded-tl-full';
          if (index === 1) borderRadius = 'rounded-tr-full';
          if (index === 2) borderRadius = 'rounded-bl-full';
          if (index === 3) borderRadius = 'rounded-br-full';

          return (
            <div 
              key={c.id} 
              className={`w-full h-full cursor-pointer transition-all duration-100 opacity-60 ${borderRadius} ${c.color} ${activeBtn === c.id ? c.active + ' opacity-100 scale-105 z-20' : ''}`}
              onMouseDown={() => handleBtnClick(c.id)}
              onTouchStart={(e) => { e.preventDefault(); handleBtnClick(c.id); }}
            />
          );
        })}
      </div>

      {gameOver && (
          <div className="mt-8 flex flex-col items-center text-center">
              <h3 className="text-3xl text-[var(--color-neon-lime)] mb-4">GAME OVER</h3>
              <div className="flex gap-4">
                 <RetroButton onClick={() => {
                     setSequence([]);
                     setPlayerSeq([]);
                     setGameOver(false);
                 }}>RETRY</RetroButton>
                 <RetroButton onClick={() => changeScene('GAME_SELECT')}>MENU</RetroButton>
              </div>
          </div>
      )}

      {!gameOver && (
        <div className="mt-8">
            <RetroButton onClick={() => changeScene('GAME_SELECT')}>END GAME</RetroButton>
        </div>
      )}
    </div>
  );
}
