import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RetroButton } from '../components/RetroButton';
import { useStats, useGlobalUI } from '../store';
import { soundManager } from '../lib/sound';
import { ArcadeInput } from '../components/ArcadeInput';

interface Props {
  config: { difficulty: string };
  changeScene: (scene: string) => void;
}

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const TETROMINOS = {
  0: { shape: [[0]], color: '#000000' }, // Empty
  I: { shape: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ], color: '#00F0FF' }, // Cyan
  J: { shape: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ], color: '#0000FF' }, // Blue
  L: { shape: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ], color: '#FFA500' }, // Orange
  O: { shape: [
    [1, 1],
    [1, 1]
  ], color: '#FFFF00' }, // Yellow
  S: { shape: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ], color: '#00FF00' }, // Green
  T: { shape: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ], color: '#FF00FF' }, // Magenta
  Z: { shape: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ], color: '#FF0000' }  // Red
};

type TetrominoType = keyof typeof TETROMINOS;
const randomTetromino = () => {
  const tetrominos: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

const createBoard = () => Array.from(Array(ROWS), () => new Array(COLS).fill(0));

export default function Tetris({ config, changeScene }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [nameEntered, setNameEntered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPiece, setNextPiece] = useState(() => randomTetromino());

  const { addGameResult, addHighScore, tetrisLeaderboard } = useStats();
  const { shakeScreen } = useGlobalUI();

  const dropTimeRef = useRef(1000);
  const lastDropTimeRef = useRef(0);
  
  const stateRef = useRef({
      board: createBoard(),
      player: {
          pos: { x: 0, y: 0 },
          tetromino: TETROMINOS[0].shape,
          color: TETROMINOS[0].color,
      },
      dropTime: 1000,
  });

  const getDifficultyMultiplier = () => {
      if (config.difficulty === 'Hard') return 1.5;
      if (config.difficulty === 'Easy') return 0.7;
      return 1.0;
  };

  const isHighScore = score > 0 && (tetrisLeaderboard.length < 10 || score > (tetrisLeaderboard[tetrisLeaderboard.length - 1]?.score || 0));

  const resetPlayer = useCallback(() => {
    setNextPiece(prevNext => {
      stateRef.current.player = {
        pos: { x: Math.floor(COLS / 2) - Math.floor(prevNext.shape[0].length / 2), y: 0 },
        tetromino: prevNext.shape,
        color: prevNext.color,
      };
      return randomTetromino();
    });
  }, []);

  const initGame = useCallback(() => {
    stateRef.current.board = createBoard();
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setNameEntered(false);
    setIsPaused(false);
    
    const mult = getDifficultyMultiplier();
    stateRef.current.dropTime = 1000 / mult;
  }, [config.difficulty, resetPlayer]);

  useEffect(() => {
      initGame();
  }, [initGame]);

  const checkCollision = (player: any, board: any, { x: moveX, y: moveY }: { x: number; y: number }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
      for (let x = 0; x < player.tetromino[y].length; x += 1) {
        if (player.tetromino[y][x] !== 0) {
          if (
            !board[y + player.pos.y + moveY] ||
            !board[y + player.pos.y + moveY][x + player.pos.x + moveX] === undefined ||
             board[y + player.pos.y + moveY][x + player.pos.x + moveX] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: (string | number)[][], dir: number) => {
    const rotatedTetro = matrix.map((_, index) => matrix.map((col) => col[index]));
    if (dir > 0) return rotatedTetro.map((row) => row.reverse());
    return rotatedTetro.reverse();
  };

  const playerRotate = (board: any, dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(stateRef.current.player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    // basic SRS-like wall kicks
    const kicks = [
      {x: 0, y: 0},
      {x: 1, y: 0}, {x: -1, y: 0}, {x: 2, y: 0}, {x: -2, y: 0},
      {x: 0, y: -1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: -2}
    ];

    for (let i = 0; i < kicks.length; i++) {
        const kick = kicks[i];
        if (!checkCollision(clonedPlayer, board, kick)) {
            clonedPlayer.pos.x += kick.x;
            clonedPlayer.pos.y += kick.y;
            stateRef.current.player = clonedPlayer;
            soundManager.move();
            return;
        }
    }
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(stateRef.current.player, stateRef.current.board, { x: dir, y: 0 })) {
      stateRef.current.player.pos.x += dir;
      soundManager.move();
    }
  };

  const drop = () => {
    if (checkCollision(stateRef.current.player, stateRef.current.board, { x: 0, y: 1 })) {
      if (stateRef.current.player.pos.y < 1) {
        setGameOver(true);
        addGameResult('loss');
        soundManager.loss();
        shakeScreen();
        return;
      }
      mergePlayer();
    } else {
      stateRef.current.player.pos.y += 1;
    }
  };

  const hardDrop = () => {
    let dy = 0;
    while(!checkCollision(stateRef.current.player, stateRef.current.board, { x: 0, y: dy + 1 })) {
        dy++;
    }
    stateRef.current.player.pos.y += dy;
    soundManager.click();
    mergePlayer();
  };

  const mergePlayer = () => {
    const { player, board } = stateRef.current;
    
    player.tetromino.forEach((row: any, y: number) => {
      row.forEach((value: any, x: number) => {
        if (value !== 0) {
          if (board[y + player.pos.y]) {
            board[y + player.pos.y][x + player.pos.x] = player.color;
          }
        }
      });
    });

    // clear lines
    let linesCleared = 0;
    const newBoard = board.reduce((acc: any, row: any) => {
      if (row.findIndex((cell: any) => cell === 0) === -1) {
        linesCleared += 1;
        acc.unshift(new Array(COLS).fill(0));
        return acc;
      }
      acc.push(row);
      return acc;
    }, []);

    stateRef.current.board = newBoard;

    if (linesCleared > 0) {
      soundManager.win(); // use win chime for line clear
      setLines((prev) => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        setLevel(newLevel);
        const mult = getDifficultyMultiplier();
        stateRef.current.dropTime = 1000 / (newLevel * 0.5 + 0.5) / mult;
        return newLines;
      });
      const points = [0, 40, 100, 300, 1200];
      setScore((prev) => prev + points[linesCleared] * level);
    } else {
        soundManager.eat(); // light drop sound
    }

    resetPlayer();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      const keyCodes = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
      if (keyCodes.includes(e.key)) {
          e.preventDefault(); // Prevent scrolling logic for arrows plus space
      }

      if (e.key === 'p' || e.key === 'P') {
         setIsPaused(p => !p);
         return;
      }

      if (isPaused) return;

      if (e.key === 'ArrowLeft') movePlayer(-1);
      else if (e.key === 'ArrowRight') movePlayer(1);
      else if (e.key === 'ArrowDown') {
          drop();
          lastDropTimeRef.current = performance.now();
      }
      else if (e.key === 'ArrowUp') playerRotate(stateRef.current.board, 1);
      else if (e.key === ' ') {
          hardDrop();
          lastDropTimeRef.current = performance.now();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused, level]); // Need to re-bind when state changes to capture correct refs internally if needed. actually refs are stable but good practice

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let prevTime = 0;

    const loop = (time: number) => {
      if (!isPaused && !gameOver) {
          if (!prevTime) prevTime = time;
          const deltaTime = time - prevTime;
          
          if (time - lastDropTimeRef.current > stateRef.current.dropTime) {
            drop();
            lastDropTimeRef.current = time;
          }
      }

      prevTime = time;

      // Draw
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const offset_x = (canvas.width - COLS * BLOCK_SIZE) / 2;
      const offset_y = 10;
      
      // Draw grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      for (let r = 0; r <= ROWS; r++) {
         ctx.beginPath();
         ctx.moveTo(offset_x, offset_y + r * BLOCK_SIZE);
         ctx.lineTo(offset_x + COLS * BLOCK_SIZE, offset_y + r * BLOCK_SIZE);
         ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
         ctx.beginPath();
         ctx.moveTo(offset_x + c * BLOCK_SIZE, offset_y);
         ctx.lineTo(offset_x + c * BLOCK_SIZE, offset_y + ROWS * BLOCK_SIZE);
         ctx.stroke();
      }

      // Draw board
      stateRef.current.board.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color !== 0) {
            ctx.fillStyle = color as string;
            ctx.fillRect(offset_x + x * BLOCK_SIZE, offset_y + y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(offset_x + x * BLOCK_SIZE, offset_y + y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          }
        });
      });

      // Draw player
      if (!gameOver) {
          stateRef.current.player.tetromino.forEach((row, y) => {
            row.forEach((value, x) => {
              if (value !== 0) {
                const px = offset_x + (stateRef.current.player.pos.x + x) * BLOCK_SIZE;
                const py = offset_y + (stateRef.current.player.pos.y + y) * BLOCK_SIZE;
                
                ctx.fillStyle = stateRef.current.player.color;
                ctx.fillRect(px, py, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(px, py, BLOCK_SIZE/2, BLOCK_SIZE/2);
              }
            });
          });
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameOver, isPaused]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-full relative">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl max-h-[80vh]">
          
         <div className="flex-1 flex justify-center order-2 md:order-1 relative">
             <canvas 
                ref={canvasRef} 
                width={350} 
                height={620} 
                className="border-4 border-[var(--color-neon-cyan)] shadow-2xl bg-[#000]"
             />

             {isPaused && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 w-[350px] mx-auto">
                    <span className="text-4xl text-[var(--color-neon-cyan)] blink">PAUSED</span>
                </div>
             )}

             {gameOver && (
                <div className="absolute inset-y-0 w-[350px] mx-auto bg-black/80 flex flex-col items-center justify-center z-10 p-6 text-center">
                    <h2 className="text-5xl font-retro text-[var(--color-neon-magenta)] text-shadow-magenta mb-4 animate-pulse-fast">
                      GAME OVER
                    </h2>
                    
                    {isHighScore && !nameEntered ? (
                        <ArcadeInput onSubmit={(name) => {
                            addHighScore('tetris', { name, score, date: new Date().toISOString() });
                            setNameEntered(true);
                        }} />
                    ) : (
                        <div className="flex flex-col gap-4 mt-8">
                            <RetroButton onClick={initGame}>PLAY AGAIN</RetroButton>
                            <RetroButton onClick={() => changeScene('GAME_SELECT')}>MENU</RetroButton>
                        </div>
                    )}
                </div>
             )}
         </div>

         <div className="flex-1 flex flex-col order-1 md:order-2">
            <h1 className="font-retro text-6xl text-[var(--color-neon-cyan)] text-shadow-cyan mb-8 uppercase text-center md:text-left">
               TETRIS
            </h1>

            <div className="border-4 border-[#333] p-6 mb-8 bg-[#111]">
                <div className="mb-4">
                    <div className="text-[var(--color-neon-magenta)] text-xl font-bold uppercase mb-1">SCORE</div>
                    <div className="text-[var(--color-neon-lime)] text-4xl">{score}</div>
                </div>
                <div className="mb-4">
                    <div className="text-[var(--color-neon-cyan)] text-xl font-bold uppercase mb-1">LEVEL</div>
                    <div className="text-white text-3xl">{level}</div>
                </div>
                <div>
                    <div className="text-[#aaa] text-lg font-bold uppercase mb-1">LINES</div>
                    <div className="text-white text-2xl">{lines}</div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#333]">
                    <div className="text-[var(--color-neon-lime)] text-lg font-bold uppercase mb-4">NEXT PIECE</div>
                    <div className="flex items-center justify-start">
                        <div className="inline-flex flex-col gap-[2px]">
                           {nextPiece && nextPiece.shape.map((row, y) => (
                             <div key={y} className="flex gap-[2px]">
                               {row.map((cell, x) => (
                                 <div 
                                   key={x} 
                                   className="w-5 h-5 rounded-[2px]"
                                   style={{ 
                                     backgroundColor: cell ? nextPiece.color : 'transparent',
                                     boxShadow: cell ? 'inset 0 0 4px rgba(0,0,0,0.5)' : 'none'
                                   }} 
                                 />
                               ))}
                             </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-[#888] font-pixel text-sm uppercase leading-loose border-2 border-[#333] p-4 bg-black/50">
               <strong className="text-white">CONTROLS:</strong><br />
               Left/Right : Move<br />
               Up : Rotate<br />
               Down : Soft Drop<br />
               Space : Hard Drop<br />
               P : Pause
            </div>

            {!gameOver && (
               <div className="mt-auto pt-8 flex justify-center md:justify-start">
                   <RetroButton onClick={() => changeScene('GAME_SELECT')}>END GAME</RetroButton>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
