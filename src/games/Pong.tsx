import React, { useEffect, useRef, useState } from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';
import { useStats, useGlobalUI } from '../store';
import { soundManager } from '../lib/sound';

interface Props {
  config: { players: number; difficulty: string };
  changeScene: (scene: string) => void;
}

export default function Pong({ config, changeScene }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const { addGameResult } = useStats();
  const { shakeScreen } = useGlobalUI();

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  // Game state
  const gameState = useRef({
    p1: { y: 200, score: 0 },
    p2: { y: 200, score: 0 },
    ball: { x: 400, y: 250, vx: 5, vy: 5 },
    keys: { w: false, s: false, up: false, down: false },
  });

  const PADDLE_H = 80;
  const PADDLE_W = 10;
  const BALL_SIZE = 10;
  const WIN_SCORE = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', ' '];
      if (keys.includes(e.key)) e.preventDefault();

      if (e.key === 'w' || e.key === 'W') gameState.current.keys.w = true;
      if (e.key === 's' || e.key === 'S') gameState.current.keys.s = true;
      if (e.key === 'ArrowUp') gameState.current.keys.up = true;
      if (e.key === 'ArrowDown') gameState.current.keys.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', ' '];
      if (keys.includes(e.key)) e.preventDefault();

      if (e.key === 'w' || e.key === 'W') gameState.current.keys.w = false;
      if (e.key === 's' || e.key === 'S') gameState.current.keys.s = false;
      if (e.key === 'ArrowUp') gameState.current.keys.up = false;
      if (e.key === 'ArrowDown') gameState.current.keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let speedObj = {
        'Easy': { paddle: 4, ai: 3, ball: 4 },
        'Normal': { paddle: 6, ai: 5, ball: 6 },
        'Hard': { paddle: 8, ai: 7, ball: 8 }
    };
    const speeds = speedObj[config.difficulty as keyof typeof speedObj] || speedObj['Normal'];

    // initial random direction
    gameState.current.ball.vx = (Math.random() > 0.5 ? 1 : -1) * speeds.ball;
    gameState.current.ball.vy = (Math.random() > 0.5 ? 1 : -1) * speeds.ball;

    const gameLoop = () => {
      const state = gameState.current;

      // Move P1
      if (state.keys.w && state.p1.y > 0) state.p1.y -= speeds.paddle;
      if (state.keys.s && state.p1.y < canvas.height - PADDLE_H) state.p1.y += speeds.paddle;

      // Move P2 or AI
      if (config.players === 2) {
        if (state.keys.up && state.p2.y > 0) state.p2.y -= speeds.paddle;
        if (state.keys.down && state.p2.y < canvas.height - PADDLE_H) state.p2.y += speeds.paddle;
      } else {
        // AI Logic
        const targetY = state.ball.y - PADDLE_H / 2;
        if (state.p2.y < targetY - 10 && state.p2.y < canvas.height - PADDLE_H) state.p2.y += speeds.ai;
        if (state.p2.y > targetY + 10 && state.p2.y > 0) state.p2.y -= speeds.ai;
      }

      // Ball physics
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;

      // Wall bounce
      if (state.ball.y <= 0 && state.ball.vy < 0) {
        state.ball.vy *= -1;
      } else if (state.ball.y >= canvas.height - BALL_SIZE && state.ball.vy > 0) {
        state.ball.vy *= -1;
      }

      // Paddle bounce
      const inP1Y = state.ball.y + BALL_SIZE >= state.p1.y && state.ball.y <= state.p1.y + PADDLE_H;
      if (state.ball.vx < 0 && state.ball.x <= PADDLE_W + 10 && inP1Y) {
        state.ball.x = PADDLE_W + 10;
        state.ball.vx *= -1;
        state.ball.vx = Math.min(state.ball.vx * 1.05, 12); // speed up, max 12
        state.ball.vy += ((state.ball.y + BALL_SIZE/2) - (state.p1.y + PADDLE_H/2)) * 0.1; // adjust angle based on hit position
        soundManager.move();
      }

      const inP2Y = state.ball.y + BALL_SIZE >= state.p2.y && state.ball.y <= state.p2.y + PADDLE_H;
      if (state.ball.vx > 0 && state.ball.x >= canvas.width - PADDLE_W - 10 - BALL_SIZE && inP2Y) {
        state.ball.x = canvas.width - PADDLE_W - 10 - BALL_SIZE;
        state.ball.vx *= -1;
        state.ball.vx = Math.max(state.ball.vx * 1.05, -12); // speed up, max -12
        state.ball.vy += ((state.ball.y + BALL_SIZE/2) - (state.p2.y + PADDLE_H/2)) * 0.1;
        soundManager.move();
      }

      // Scoring
      if (state.ball.x < 0) {
        state.p2.score++;
        soundManager.loss(); // Or a point scored sound
        resetBall();
      } else if (state.ball.x > canvas.width) {
        state.p1.score++;
        soundManager.loss();
        resetBall();
      }

      // Draw
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dash line
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.strokeStyle = '#333';
      ctx.stroke();

      ctx.fillStyle = '#00F0FF'; // cyan
      ctx.fillRect(10, state.p1.y, PADDLE_W, PADDLE_H);
      ctx.fillStyle = '#FF00FF'; // magenta
      ctx.fillRect(canvas.width - 20, state.p2.y, PADDLE_W, PADDLE_H);

      ctx.fillStyle = 'white';
      ctx.fillRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);

      ctx.font = '40px VT323';
      ctx.fillText(state.p1.score.toString(), canvas.width / 4, 50);
      ctx.fillText(state.p2.score.toString(), (canvas.width / 4) * 3, 50);

      if (state.p1.score >= WIN_SCORE || state.p2.score >= WIN_SCORE) {
        const p1Wins = state.p1.score >= WIN_SCORE;
        setWinner(p1Wins ? 1 : 2);
        setGameOver(true);
        if (p1Wins) { soundManager.win(); addGameResult('win'); }
        else { 
            soundManager.loss(); 
            addGameResult(config.players === 1 ? 'loss' : 'win');
            if (config.players === 1) shakeScreen();
        }
        return;
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    const resetBall = () => {
      gameState.current.ball.x = canvas.width / 2;
      gameState.current.ball.y = canvas.height / 2;
      gameState.current.ball.vx = (Math.random() > 0.5 ? 1 : -1) * speeds.ball;
      gameState.current.ball.vy = (Math.random() > 0.5 ? 1 : -1) * speeds.ball;
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [config.difficulty, config.players, gameOver]);

  return (
    <div 
      className="flex flex-col items-center justify-center p-4 min-h-full relative focus:outline-none"
      ref={(el) => { if (el) el.focus(); }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        if (e.key === 'w' || e.key === 'W') gameState.current.keys.w = true;
        if (e.key === 's' || e.key === 'S') gameState.current.keys.s = true;
        if (e.key === 'ArrowUp') gameState.current.keys.up = true;
        if (e.key === 'ArrowDown') gameState.current.keys.down = true;
      }}
      onKeyUp={(e) => {
        if (e.key === 'w' || e.key === 'W') gameState.current.keys.w = false;
        if (e.key === 's' || e.key === 'S') gameState.current.keys.s = false;
        if (e.key === 'ArrowUp') gameState.current.keys.up = false;
        if (e.key === 'ArrowDown') gameState.current.keys.down = false;
      }}
    >
      <div className="w-full max-w-4xl flex justify-between mb-4 mt-8 md:mt-2 px-2 md:px-0">
        <h2 className="text-xl md:text-3xl text-[var(--color-neon-cyan)] text-shadow-cyan uppercase">P1: W/S</h2>
        <h2 className="text-xl md:text-3xl text-[var(--color-neon-magenta)] text-shadow-magenta uppercase">
          {config.players === 2 ? 'P2: UP/DOWN' : 'AI: CPU'}
        </h2>
      </div>

      <div className="relative w-full max-w-4xl flex flex-col md:block items-center">
         <canvas 
            ref={canvasRef} 
            width={800} 
            height={500} 
            className="border-4 border-[var(--color-neon-lime)] shadow-[0_0_20px_rgba(0,255,65,0.2)] bg-black max-w-full aspect-[8/5] touch-none"
            onTouchMove={(e) => {
                e.preventDefault();
                if (!canvasRef.current || gameOver) return;
                const rect = canvasRef.current.getBoundingClientRect();
                for (let i = 0; i < e.touches.length; i++) {
                    const touch = e.touches[i];
                    const y = (touch.clientY - rect.top) * (500 / rect.height);
                    const x = (touch.clientX - rect.left) * (800 / rect.width);
                    if (x < 400) {
                        gameState.current.p1.y = Math.max(0, Math.min(500 - PADDLE_H, y - PADDLE_H / 2));
                    } else if (config.players === 2) {
                        gameState.current.p2.y = Math.max(0, Math.min(500 - PADDLE_H, y - PADDLE_H / 2));
                    }
                }
            }}
         />
         
         {/* Mobile On-Screen Controls */}
         <div className="flex w-full justify-between mt-4 md:hidden px-4">
             <div className="flex flex-col gap-2">
                 <button 
                    className="w-16 h-16 bg-gray-800/80 border-2 border-[var(--color-neon-cyan)] rounded-full text-[var(--color-neon-cyan)] text-2xl"
                    onPointerDown={(e) => { e.preventDefault(); gameState.current.keys.w = true; }}
                    onPointerUp={(e) => { e.preventDefault(); gameState.current.keys.w = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); gameState.current.keys.w = false; }}
                 >↑</button>
                 <button 
                    className="w-16 h-16 bg-gray-800/80 border-2 border-[var(--color-neon-cyan)] rounded-full text-[var(--color-neon-cyan)] text-2xl"
                    onPointerDown={(e) => { e.preventDefault(); gameState.current.keys.s = true; }}
                    onPointerUp={(e) => { e.preventDefault(); gameState.current.keys.s = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); gameState.current.keys.s = false; }}
                 >↓</button>
             </div>
             
             {config.players === 2 && (
                 <div className="flex flex-col gap-2">
                     <button 
                        className="w-16 h-16 bg-gray-800/80 border-2 border-[var(--color-neon-magenta)] rounded-full text-[var(--color-neon-magenta)] text-2xl"
                        onPointerDown={(e) => { e.preventDefault(); gameState.current.keys.up = true; }}
                        onPointerUp={(e) => { e.preventDefault(); gameState.current.keys.up = false; }}
                        onPointerCancel={(e) => { e.preventDefault(); gameState.current.keys.up = false; }}
                     >↑</button>
                     <button 
                        className="w-16 h-16 bg-gray-800/80 border-2 border-[var(--color-neon-magenta)] rounded-full text-[var(--color-neon-magenta)] text-2xl"
                        onPointerDown={(e) => { e.preventDefault(); gameState.current.keys.down = true; }}
                        onPointerUp={(e) => { e.preventDefault(); gameState.current.keys.down = false; }}
                        onPointerCancel={(e) => { e.preventDefault(); gameState.current.keys.down = false; }}
                     >↓</button>
                 </div>
             )}
         </div>

         {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-pulse-fast">
             <h2 className="text-5xl md:text-7xl font-retro text-[var(--color-neon-lime)] text-shadow-lime mb-8">
               PLAYER {winner} WINS!
             </h2>
             <div className="flex gap-4">
                 <RetroButton onClick={() => {
                     gameState.current = {
                        p1: { y: 200, score: 0 },
                        p2: { y: 200, score: 0 },
                        ball: { x: 400, y: 250, vx: 5, vy: 5 },
                        keys: { w: false, s: false, up: false, down: false },
                     };
                     setWinner(null);
                     setGameOver(false);
                 }}>PLAY AGAIN</RetroButton>
                 <RetroButton onClick={() => changeScene('GAME_SELECT')}>MENU</RetroButton>
             </div>
          </div>
         )}
      </div>

       {!gameOver && (
        <div className="mt-8 flex gap-4">
            <RetroButton onClick={() => changeScene('GAME_SELECT')}>END GAME</RetroButton>
        </div>
      )}
    </div>
  );
}
