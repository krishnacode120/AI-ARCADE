import React, { useEffect, useRef, useState } from 'react';
import { RetroButton } from '../components/RetroButton';
import { useStats, useGlobalUI } from '../store';
import { soundManager } from '../lib/sound';
import { ArcadeInput } from '../components/ArcadeInput';

interface Props {
  config: { difficulty: string };
  changeScene: (scene: string) => void;
}

type Ship = { x: number, y: number, vx: number, vy: number, radius: number, angle: number, thrusting: boolean };
type Asteroid = { x: number, y: number, vx: number, vy: number, size: number, radius: number, offsets: number[], spriteX: number, spriteY: number };
type Bullet = { x: number, y: number, vx: number, vy: number, life: number };

const FPS = 60;
const FRICTION = 0.99;
const SHIP_THRUST = 0.15;
const TURN_SPEED = 0.1;
const BULLET_SPEED = 7;
const MAX_BULLET_LIFE = 60;
const ASTEROID_VERTICES = 10;
const ASTEROID_JAGGEDNESS = 0.4;
const ASTEROID_SPEED_BASE = 1;

export default function Asteroids({ config, changeScene }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const shipImgRef = useRef<HTMLImageElement | null>(null);
  const astImgRef = useRef<HTMLImageElement | null>(null);

  const { addGameResult, addHighScore, asteroidsLeaderboard } = useStats();
  const { shakeScreen } = useGlobalUI();
  const [nameEntered, setNameEntered] = useState(false);

  // State refs for the game loop
  const state = useRef({
    score: 0,
    ship: { x: 400, y: 300, vx: 0, vy: 0, radius: 15, angle: -Math.PI / 2, thrusting: false } as Ship,
    asteroids: [] as Asteroid[],
    bullets: [] as Bullet[],
    keys: { left: false, right: false, up: false, space: false },
    lastShot: 0,
  });

  const getDifficultyMultiplier = () => {
      switch(config.difficulty) {
          case 'Hard': return 1.5;
          case 'Easy': return 0.7;
          default: return 1.0;
      }
  };

  const createAsteroid = (x: number, y: number, size: number): Asteroid => {
      let radius = size * 20; 
      let offsets = [];
      for (let i = 0; i < ASTEROID_VERTICES; i++) {
          offsets.push(Math.random() * ASTEROID_JAGGEDNESS * 2 + 1 - ASTEROID_JAGGEDNESS);
      }
      
      const mult = getDifficultyMultiplier();
      const speed = (ASTEROID_SPEED_BASE + (4 - size) * 0.5) * mult;
      const angle = Math.random() * Math.PI * 2;
      
      // Select a random sprite from the sheet (assuming roughly 3 columns, 4 rows for variety)
      const spriteX = Math.floor(Math.random() * 3);
      const spriteY = Math.floor(Math.random() * 4);

      return {
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          radius,
          offsets,
          spriteX,
          spriteY
      };
  };

  const initGame = () => {
    setGameOver(false);
    setScore(0);
    setNameEntered(false);
    const canvas = canvasRef.current;
    const cw = canvas ? canvas.width : 800;
    const ch = canvas ? canvas.height : 600;

    state.current = {
      score: 0,
      ship: { x: cw / 2, y: ch / 2, vx: 0, vy: 0, radius: 20, angle: -Math.PI / 2, thrusting: false },
      asteroids: [],
      bullets: [],
      keys: { left: false, right: false, up: false, space: false },
      lastShot: 0,
    };

    const initialAsteroids = config.difficulty === 'Hard' ? 6 : (config.difficulty === 'Easy' ? 3 : 4);
    for (let i = 0; i < initialAsteroids; i++) {
        let ax, ay;
        // make sure they don't spawn on the ship
        do {
            ax = Math.random() * cw;
            ay = Math.random() * ch;
        } while (distBetweenPoints(ax, ay, cw/2, ch/2) < 150);
        
        state.current.asteroids.push(createAsteroid(ax, ay, 3));
    }
  };

  const distBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  useEffect(() => {
    // Load images
    const shipImg = new Image();
    shipImg.src = 'https://storage.googleapis.com/mweb-prompt-data-prod/b57564d5-0f04-4c40-beec-bd7df630da9e/ship.png';
    shipImg.onload = () => { shipImgRef.current = shipImg; };

    const astImg = new Image();
    astImg.src = 'https://storage.googleapis.com/mweb-prompt-data-prod/b57564d5-0f04-4c40-beec-bd7df630da9e/asteriod.png';
    astImg.onload = () => { astImgRef.current = astImg; };
  }, []);

  useEffect(() => {
    initGame();
  }, [config.difficulty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '];
      if (keys.includes(e.key)) {
         e.preventDefault();
      }
      if (e.key === 'ArrowLeft') state.current.keys.left = true;
      if (e.key === 'ArrowRight') state.current.keys.right = true;
      if (e.key === 'ArrowUp') state.current.keys.up = true;
      if (e.key === ' ') state.current.keys.space = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '];
      if (keys.includes(e.key)) {
         e.preventDefault();
      }
      if (e.key === 'ArrowLeft') state.current.keys.left = false;
      if (e.key === 'ArrowRight') state.current.keys.right = false;
      if (e.key === 'ArrowUp') state.current.keys.up = false;
      if (e.key === ' ') state.current.keys.space = false;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let lastTime = 0;

    const gameLoop = (time: number) => {
      if (gameOver) return;
      
      const st = state.current;
      const cvsW = canvas.width;
      const cvsH = canvas.height;

      // Update Ship
      if (st.keys.left) st.ship.angle -= TURN_SPEED;
      if (st.keys.right) st.ship.angle += TURN_SPEED;
      if (st.keys.up) {
          st.ship.thrusting = true;
          st.ship.vx += SHIP_THRUST * Math.cos(st.ship.angle);
          st.ship.vy += SHIP_THRUST * Math.sin(st.ship.angle);
      } else {
          st.ship.thrusting = false;
          st.ship.vx *= FRICTION;
          st.ship.vy *= FRICTION;
      }

      st.ship.x += st.ship.vx;
      st.ship.y += st.ship.vy;

      // Screen wrap ship
      if (st.ship.x < 0 - st.ship.radius) st.ship.x = cvsW + st.ship.radius;
      else if (st.ship.x > cvsW + st.ship.radius) st.ship.x = 0 - st.ship.radius;
      if (st.ship.y < 0 - st.ship.radius) st.ship.y = cvsH + st.ship.radius;
      else if (st.ship.y > cvsH + st.ship.radius) st.ship.y = 0 - st.ship.radius;

      // Shoot
      if (st.keys.space && time - st.lastShot > 200) {
          st.bullets.push({
              x: st.ship.x + Math.cos(st.ship.angle) * st.ship.radius,
              y: st.ship.y + Math.sin(st.ship.angle) * st.ship.radius,
              vx: Math.cos(st.ship.angle) * BULLET_SPEED,
              vy: Math.sin(st.ship.angle) * BULLET_SPEED,
              life: MAX_BULLET_LIFE
          });
          st.lastShot = time;
          soundManager.move(); // pew pew sound
      }

      // Update Bullets
      for (let i = st.bullets.length - 1; i >= 0; i--) {
          const b = st.bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          b.life--;
          
          if (b.x < 0) b.x = cvsW;
          else if (b.x > cvsW) b.x = 0;
          if (b.y < 0) b.y = cvsH;
          else if (b.y > cvsH) b.y = 0;

          if (b.life <= 0) st.bullets.splice(i, 1);
      }

      // Update Asteroids
      for (let a of st.asteroids) {
          a.x += a.vx;
          a.y += a.vy;

          if (a.x < 0 - a.radius) a.x = cvsW + a.radius;
          else if (a.x > cvsW + a.radius) a.x = 0 - a.radius;
          if (a.y < 0 - a.radius) a.y = cvsH + a.radius;
          else if (a.y > cvsH + a.radius) a.y = 0 - a.radius;
      }

      // Collisions: Bullet vs Asteroid
      for (let i = st.asteroids.length - 1; i >= 0; i--) {
          const a = st.asteroids[i];
          let hit = false;
          for (let j = st.bullets.length - 1; j >= 0; j--) {
              const b = st.bullets[j];
              if (distBetweenPoints(a.x, a.y, b.x, b.y) < a.radius) {
                  // Hit!
                  st.bullets.splice(j, 1);
                  hit = true;
                  break;
              }
          }
          if (hit) {
              soundManager.click();
              const pts = (4 - a.size) * 100;
              st.score += pts;
              setScore(st.score);
              
              st.asteroids.splice(i, 1);
          }
      }

      // Respawn asteroids if all destroyed
      if (st.asteroids.length === 0) {
          const num = config.difficulty === 'Hard' ? 6 : (config.difficulty === 'Easy' ? 4 : 5);
          for (let i = 0; i < num; i++) {
              let ax, ay;
              do {
                  ax = Math.random() * cvsW;
                  ay = Math.random() * cvsH;
              } while (distBetweenPoints(ax, ay, st.ship.x, st.ship.y) < 150);
              st.asteroids.push(createAsteroid(ax, ay, 3));
          }
      }

      // Collisions: Ship vs Asteroid
      if (!gameOver) {
          for (let a of st.asteroids) {
              // use a slightly smaller hitbox for ship when checking asteroids
              if (distBetweenPoints(st.ship.x, st.ship.y, a.x, a.y) < (st.ship.radius * 0.8) + (a.radius * 0.8)) {
                  setGameOver(true);
                  soundManager.loss();
                  shakeScreen();
                  addGameResult('loss');
              }
          }
      }

      // Drawing
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, cvsW, cvsH);

      // Draw Ship
      if (!gameOver) {
          ctx.save();
          ctx.translate(st.ship.x, st.ship.y);
          // Rocket naturally points up, so we add 90 degrees (Math.PI/2) to angle
          ctx.rotate(st.ship.angle + Math.PI / 2);
          
          if (shipImgRef.current) {
              // Draw ship image centered
              const w = st.ship.radius * 2.5;
              const h = st.ship.radius * 3.5;
              ctx.drawImage(shipImgRef.current, -w / 2, -h / 2, w, h);
          } else {
              // Fallback realistic spaceship (white scheme)
              ctx.strokeStyle = '#FFFFFF';
              ctx.fillStyle = '#DDDDDD';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              
              // Nose cone
              ctx.moveTo(0, -st.ship.radius * 1.5);
              ctx.lineTo(st.ship.radius * 0.4, -st.ship.radius * 0.5);
              
              // Cockpit structure
              ctx.lineTo(st.ship.radius * 0.6, st.ship.radius * 0.5);
              
              // Right Wing
              ctx.lineTo(st.ship.radius * 1.2, st.ship.radius);
              ctx.lineTo(st.ship.radius * 0.6, st.ship.radius * 1.2);
              
              // Base and Engine
              ctx.lineTo(st.ship.radius * 0.3, st.ship.radius);
              ctx.lineTo(0, st.ship.radius * 1.2); // center back engine
              ctx.lineTo(-st.ship.radius * 0.3, st.ship.radius);
              
              // Left Wing
              ctx.lineTo(-st.ship.radius * 0.6, st.ship.radius * 1.2);
              ctx.lineTo(-st.ship.radius * 1.2, st.ship.radius);
              
              // Cockpit structure
              ctx.lineTo(-st.ship.radius * 0.6, st.ship.radius * 0.5);
              
              // Nose cone
              ctx.lineTo(-st.ship.radius * 0.4, -st.ship.radius * 0.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Window
              ctx.fillStyle = '#00F0FF';
              ctx.beginPath();
              ctx.ellipse(0, -st.ship.radius * 0.2, st.ship.radius * 0.2, st.ship.radius * 0.4, 0, 0, Math.PI * 2);
              ctx.fill();
          }

          // Thrust flame
          if (st.ship.thrusting) {
              ctx.fillStyle = '#FFA500'; // Orange base
              ctx.beginPath();
              ctx.moveTo(-st.ship.radius * 0.3, st.ship.radius * 1.2);
              ctx.lineTo(st.ship.radius * 0.3, st.ship.radius * 1.2);
              ctx.lineTo(0, st.ship.radius * 2.5 + Math.random() * 5); // flicker flame tip
              ctx.closePath();
              ctx.fill();
              
              // Inner hot core
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.moveTo(-st.ship.radius * 0.15, st.ship.radius * 1.2);
              ctx.lineTo(st.ship.radius * 0.15, st.ship.radius * 1.2);
              ctx.lineTo(0, st.ship.radius * 1.8 + Math.random() * 3);
              ctx.closePath();
              ctx.fill();
          }
          ctx.restore();
      } else {
         // Exploding Ship
         ctx.fillStyle = '#00F0FF';
         for(let i=0; i<10; i++) {
             ctx.fillRect(st.ship.x + (Math.random()-0.5)*50, st.ship.y + (Math.random()-0.5)*50, 4, 4);
         }
      }

      // Draw Bullets
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let b of st.bullets) {
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
          ctx.stroke();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FF0000';
      }
      ctx.shadowBlur = 0; // reset

      // Draw Asteroids
      for (let a of st.asteroids) {
          ctx.save();
          ctx.translate(a.x, a.y);
          // Rotate slowly for effect
          ctx.rotate((time * 0.001) * (a.vx > 0 ? 1 : -1) + a.size);

          if (astImgRef.current) {
              // Determine slice based on pseudo-random sprite coords
              const numCols = 3; 
              const numRows = 4;
              const imgW = astImgRef.current.width;
              const imgH = astImgRef.current.height;
              
              const sliceW = imgW / numCols;
              const sliceH = imgH / numRows;
              
              const sx = a.spriteX * sliceW;
              const sy = a.spriteY * sliceH;
              
              // Draw the slice scaled to asteroid radius
              const size = a.radius * 2.4;
              ctx.filter = 'grayscale(100%)'; // Make asteroid gray
              ctx.drawImage(astImgRef.current, sx, sy, sliceW, sliceH, -size/2, -size/2, size, size);
              ctx.filter = 'none';
          } else {
              // Fallback
              ctx.strokeStyle = '#888888';
              ctx.fillStyle = '#555555';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              for (let j = 0; j < ASTEROID_VERTICES; j++) {
                  const ang = (j * Math.PI * 2) / ASTEROID_VERTICES;
                  const xInfo = a.radius * a.offsets[j] * Math.cos(ang);
                  const yInfo = a.radius * a.offsets[j] * Math.sin(ang);
                  if (j === 0) ctx.moveTo(xInfo, yInfo);
                  else ctx.lineTo(xInfo, yInfo);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
          }
          ctx.restore();
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

  }, [gameOver, config.difficulty]);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-full relative">
      <div className="w-full max-w-4xl flex justify-between mb-4 mt-8 md:mt-2 px-4">
        <h2 className="text-2xl md:text-3xl text-[var(--color-neon-cyan)] text-shadow-cyan">ASTEROIDS</h2>
        <h2 className="text-2xl md:text-3xl text-[var(--color-neon-lime)]">SCORE: {score}</h2>
      </div>

      <div className="relative w-full max-w-4xl pb-[75%] md:pb-[60%] lg:pb-0 lg:h-[600px] border-4 border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black overflow-hidden">
         <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="absolute top-0 left-0 w-full h-full object-contain"
         />
         
         {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4">
             <h2 className="text-5xl md:text-7xl font-retro text-[var(--color-neon-magenta)] text-shadow-magenta mb-4 md:mb-8 text-center animate-pulse-fast">
               SHIP DESTROYED
             </h2>
             <span className="text-2xl md:text-3xl text-[var(--color-neon-lime)] mb-4 lg:mb-8">FINAL SCORE: {score}</span>
             
             {score > 0 && (asteroidsLeaderboard.length < 10 || score > (asteroidsLeaderboard[asteroidsLeaderboard.length - 1]?.score || 0)) && !nameEntered ? (
                 <ArcadeInput onSubmit={(name) => {
                     addHighScore('asteroids', { name, score, date: new Date().toISOString() });
                     setNameEntered(true);
                 }} />
             ) : (
                 <div className="flex gap-4">
                     <RetroButton onClick={initGame}>PLAY AGAIN</RetroButton>
                     <RetroButton onClick={() => changeScene('GAME_SELECT')}>MENU</RetroButton>
                 </div>
             )}
          </div>
         )}
      </div>

      <div className="mt-4 opacity-50 text-xs md:text-sm max-w-lg text-center leading-relaxed font-pixel">
          CONTROLS: Left/Right to Rotate | Up to Thrust | Space to Fire
      </div>

       {!gameOver && (
        <div className="mt-8">
            <RetroButton onClick={() => {
                setGameOver(true);
                changeScene('GAME_SELECT');
            }}>END GAME</RetroButton>
        </div>
      )}
    </div>
  );
}
