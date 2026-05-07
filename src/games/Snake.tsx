import React, { useRef, useEffect, useState } from 'react';
import { RetroButton } from '../components/RetroButton';
import { soundManager } from '../lib/sound';
import { useStats } from '../store';

interface Props {
  config: { players: number; difficulty: string };
  changeScene: (scene: string) => void;
}

const GRID_SIZE = 20;

export default function Snake({ config, changeScene }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const { updateSnakeScore } = useStats();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let speed = 100;
    if (config.difficulty === 'Easy') speed = 150;
    if (config.difficulty === 'Hard') speed = 60;

    const cols = canvas.width / GRID_SIZE;
    const rows = canvas.height / GRID_SIZE;

    let s1 = [{ x: 5, y: 10 }];
    let d1 = { x: 1, y: 0 };
    let n1 = { x: 1, y: 0 };
    let score1_val = 0;

    let s2 = [{ x: cols - 5, y: 10 }];
    let d2 = { x: -1, y: 0 };
    let n2 = { x: -1, y: 0 };
    let score2_val = 0;

    let food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };

    const handleKeyDown = (e: KeyboardEvent) => {
      // P1 (Arrows)
      if (e.key === 'ArrowUp' && d1.y !== 1) n1 = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && d1.y !== -1) n1 = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && d1.x !== 1) n1 = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && d1.x !== -1) n1 = { x: 1, y: 0 };

      // P2 (WASD)
      if (config.players === 2) {
        if (e.key === 'w' && d2.y !== 1) n2 = { x: 0, y: -1 };
        if (e.key === 's' && d2.y !== -1) n2 = { x: 0, y: 1 };
        if (e.key === 'a' && d2.x !== 1) n2 = { x: -1, y: 0 };
        if (e.key === 'd' && d2.x !== -1) n2 = { x: 1, y: 0 };
      }
      
      if (e.key === 'Escape' || e.key === 'p') {
          setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let animationFrame: number;
    let lastTime = 0;

    const loop = (time: number) => {
      animationFrame = requestAnimationFrame(loop);
      if (gameOver || isPaused) return;

      if (time - lastTime < speed) return;
      lastTime = time;

      // Update directions
      d1 = n1;
      let head1 = { x: s1[0].x + d1.x, y: s1[0].y + d1.y };
      
      if (head1.x < 0) head1.x = cols - 1;
      if (head1.x >= cols) head1.x = 0;
      if (head1.y < 0) head1.y = rows - 1;
      if (head1.y >= rows) head1.y = 0;

      s1.unshift(head1);
      if (head1.x === food.x && head1.y === food.y) {
        soundManager.eat();
        score1_val++;
        setScore1(score1_val);
        food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
      } else {
        s1.pop();
      }

      if (config.players === 2) {
        d2 = n2;
        let head2 = { x: s2[0].x + d2.x, y: s2[0].y + d2.y };
        
        if (head2.x < 0) head2.x = cols - 1;
        if (head2.x >= cols) head2.x = 0;
        if (head2.y < 0) head2.y = rows - 1;
        if (head2.y >= rows) head2.y = 0;

        s2.unshift(head2);
        if (head2.x === food.x && head2.y === food.y) {
          soundManager.eat();
          score2_val++;
          setScore2(score2_val);
          food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
        } else {
          s2.pop();
        }
      }

      // Check collisions
      let collided = false;
      for (let i = 1; i < s1.length; i++) {
        if (head1.x === s1[i].x && head1.y === s1[i].y) collided = true;
      }
      if (config.players === 2) {
        for (let i = 1; i < s2.length; i++) {
          if (s2[0].x === s2[i].x && s2[0].y === s2[i].y) collided = true;
        }
        for (let i = 0; i < s2.length; i++) {
            if (head1.x === s2[i].x && head1.y === s2[i].y) collided = true;
        }
        for (let i = 0; i < s1.length; i++) {
             if (s2[0].x === s1[i].x && s2[0].y === s1[i].y) collided = true;
        }
      }

      if (collided) {
        setGameOver(true);
        soundManager.loss();
        if (config.players === 1 || Object.is(s1, head1) /* simple hack to just do it on any loss since snake is about surviving */ ) {
            import('../store').then(({ useGlobalUI }) => useGlobalUI.getState().shakeScreen());
        }
        return;
      }

      // Draw
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#39ff14'; // Lime for P1
      s1.forEach(p => ctx.fillRect(p.x * GRID_SIZE, p.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1));

      if (config.players === 2) {
        ctx.fillStyle = '#00ffff'; // Cyan for P2
        s2.forEach(p => ctx.fillRect(p.x * GRID_SIZE, p.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1));
      }

      ctx.fillStyle = '#ff00ff'; // Magenta food
      ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, config, isPaused]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-full relative">
      <h1 className="font-retro text-4xl text-[var(--color-neon-lime)] text-shadow-lime mb-4">SNAKE</h1>
      
      <div className="flex justify-between w-full max-w-2xl font-pixel text-3xl mb-4">
        <span className="text-[var(--color-neon-lime)]">SCORE: {score1}</span>
        {config.players === 2 && <span className="text-[var(--color-neon-cyan)]">P2: {score2}</span>}
      </div>

      <div className="relative border-4 border-gray-700 shadow-2xl">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400} 
          className="bg-[var(--color-arcade-bg)] max-w-full"
        />
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <h2 className="font-retro text-4xl text-white blink mb-8">
              {gameOver ? 'GAME OVER' : 'PAUSED'}
            </h2>
            <RetroButton onClick={() => gameOver ? setGameOver(false) : setIsPaused(false)}>
              {gameOver ? 'TRY AGAIN' : 'RESUME'}
            </RetroButton>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4 w-full justify-center">
          <RetroButton onClick={() => changeScene('GAME_SELECT')}>BACK</RetroButton>
          <RetroButton onClick={() => setIsPaused(p => !p)}>PAUSE</RetroButton>
      </div>
    </div>
  );
}
