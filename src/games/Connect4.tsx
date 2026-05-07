import React, { useState, useEffect } from 'react';
import { RetroButton } from '../components/RetroButton';
import { soundManager } from '../lib/sound';
import { useStats } from '../store';

interface Props {
  config: { players: number; difficulty: string };
  changeScene: (scene: string) => void;
}

type Player = 1 | 2 | null;

const ROWS = 6;
const COLS = 7;

export default function Connect4({ config, changeScene }: Props) {
  const [board, setBoard] = useState<Player[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [turn, setTurn] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | 'DRAW'>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const { addGameResult } = useStats();

  const checkWinner = (grid: Player[][]): Player | 'DRAW' | null => {
    // Check horizontal, vertical, diagonal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let p = grid[r][c];
        if (!p) continue;
        if (c + 3 < COLS && p === grid[r][c+1] && p === grid[r][c+2] && p === grid[r][c+3]) return p;
        if (r + 3 < ROWS && p === grid[r+1][c] && p === grid[r+2][c] && p === grid[r+3][c]) return p;
        if (r + 3 < ROWS && c + 3 < COLS && p === grid[r+1][c+1] && p === grid[r+2][c+2] && p === grid[r+3][c+3]) return p;
        if (r - 3 >= 0 && c + 3 < COLS && p === grid[r-1][c+1] && p === grid[r-2][c+2] && p === grid[r-3][c+3]) return p;
      }
    }
    if (grid[0].every(c => c !== null)) return 'DRAW';
    return null;
  };

  const dropPiece = (col: number, player: Player) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        const newBoard = board.map(row => [...row]);
        newBoard[r][col] = player;
        setBoard(newBoard);
        soundManager.move();
        
        const res = checkWinner(newBoard);
        if (res) {
          setWinner(res);
          if (res === 1) { soundManager.win(); addGameResult('win'); }
          else if (res === 2) { 
              soundManager.loss(); 
              addGameResult(config.players === 1 ? 'loss' : 'win');
              if (config.players === 1) {
                import('../store').then(({ useGlobalUI }) => useGlobalUI.getState().shakeScreen());
              }
          }
          else { soundManager.draw(); addGameResult('draw'); }
        } else {
          setTurn(player === 1 ? 2 : 1);
        }
        return true;
      }
    }
    return false;
  };

  const handleColumnClick = (c: number) => {
    if (winner || (config.players === 1 && turn === 2)) return;
    dropPiece(c, turn);
  };

  // AI Logic (simplified)
  useEffect(() => {
    if (config.players === 1 && turn === 2 && !winner) {
      const timer = setTimeout(() => {
        let availableCols = [];
        for (let c = 0; c < COLS; c++) {
          if (!board[0][c]) availableCols.push(c);
        }
        if (availableCols.length === 0) return;

        let selectedCol = availableCols[Math.floor(Math.random() * availableCols.length)];

        if (config.difficulty === 'Normal' || config.difficulty === 'Hard') {
          const evaluateWindow = (window: Player[], piece: Player) => {
              let score = 0;
              const oppPiece = piece === 1 ? 2 : 1;
              let pieceCount = 0;
              let emptyCount = 0;
              let oppCount = 0;

              for(let i=0; i<4; i++) {
                  if(window[i] === piece) pieceCount++;
                  else if(window[i] === null) emptyCount++;
                  else if(window[i] === oppPiece) oppCount++;
              }

              if (pieceCount === 4) score += 10000;
              else if (pieceCount === 3 && emptyCount === 1) score += 5;
              else if (pieceCount === 2 && emptyCount === 2) score += 2;

              if (oppCount === 3 && emptyCount === 1) score -= 80;
              
              return score;
          };

          const evaluateBoard = (grid: Player[][]) => {
             let score = 0;
             // Center column preference
             let centerCount = 0;
             for (let r=0; r<ROWS; r++) {
                 if (grid[r][3] === 2) centerCount++;
             }
             score += centerCount * 3;

             // Horizontal
             for (let r=0; r<ROWS; r++) {
                 const rowArray = grid[r];
                 for (let c=0; c<COLS-3; c++) {
                     const window = rowArray.slice(c, c+4);
                     score += evaluateWindow(window, 2);
                 }
             }

             // Vertical
             for (let c=0; c<COLS; c++) {
                 const colArray = [];
                 for (let r=0; r<ROWS; r++) colArray.push(grid[r][c]);
                 for (let r=0; r<ROWS-3; r++) {
                     const window = colArray.slice(r, r+4);
                     score += evaluateWindow(window, 2);
                 }
             }

             // Diagonals
             for (let r=0; r<ROWS-3; r++) {
                 for (let c=0; c<COLS-3; c++) {
                     const window1 = [grid[r][c], grid[r+1][c+1], grid[r+2][c+2], grid[r+3][c+3]];
                     score += evaluateWindow(window1, 2);
                     
                     const window2 = [grid[r+3][c], grid[r+2][c+1], grid[r+1][c+2], grid[r][c+3]];
                     score += evaluateWindow(window2, 2);
                 }
             }
             return score;
          };

          const getNextOpenRow = (grid: Player[][], c: number) => {
              for (let r = ROWS - 1; r >= 0; r--) {
                  if (!grid[r][c]) return r;
              }
              return -1;
          };

          const minimax = (grid: Player[][], depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
              const win = checkWinner(grid);
              if (depth === 0 || win) {
                 if (win === 2) return 1000000 - (10 - depth); // win faster
                 if (win === 1) return -1000000 + (10 - depth); // lose slower
                 if (win === 'DRAW') return 0;
                 return evaluateBoard(grid);
              }

              if (isMaximizing) {
                  let value = -Infinity;
                  for (const c of availableCols) {
                      const rTarget = getNextOpenRow(grid, c);
                      if (rTarget !== -1) {
                          const newGrid = grid.map(row => [...row]);
                          newGrid[rTarget][c] = 2;
                          value = Math.max(value, minimax(newGrid, depth - 1, alpha, beta, false));
                          alpha = Math.max(alpha, value);
                          if (alpha >= beta) break;
                      }
                  }
                  return value;
              } else {
                  let value = Infinity;
                  for (const c of availableCols) {
                      const rTarget = getNextOpenRow(grid, c);
                      if (rTarget !== -1) {
                          const newGrid = grid.map(row => [...row]);
                          newGrid[rTarget][c] = 1;
                          value = Math.min(value, minimax(newGrid, depth - 1, alpha, beta, true));
                          beta = Math.min(beta, value);
                          if (beta <= alpha) break;
                      }
                  }
                  return value;
              }
          };

          const depth = config.difficulty === 'Hard' ? 5 : 2; // Normal is depth 2 (basic lookahead), Hard is depth 5
          let bestScore = -Infinity;
          let bestCols: number[] = [];
          
          for (const c of availableCols) {
              const rTarget = getNextOpenRow(board, c);
              if (rTarget !== -1) {
                  const newGrid = board.map(row => [...row]);
                  newGrid[rTarget][c] = 2;
                  const score = minimax(newGrid, depth, -Infinity, Infinity, false);
                  if (score > bestScore) {
                      bestScore = score;
                      bestCols = [c];
                  } else if (score === bestScore) {
                      bestCols.push(c);
                  }
              }
          }
          if (bestCols.length > 0) {
              selectedCol = bestCols[Math.floor(Math.random() * bestCols.length)];
          }
        }

        dropPiece(selectedCol, 2);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, board, config]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-full">
      <h1 className="font-retro text-4xl text-[var(--color-neon-magenta)] text-shadow-magenta mb-8">CONNECT 4</h1>
      
      <div className="flex justify-between w-full max-w-2xl font-pixel text-3xl mb-4">
        <span className={turn === 1 ? 'text-[var(--color-neon-cyan)] blink' : 'text-gray-500'}>PLAYER 1</span>
        <span className={turn === 2 ? 'text-[var(--color-neon-lime)] blink' : 'text-gray-500'}>
          {config.players === 1 ? 'AI' : 'PLAYER 2'}
        </span>
      </div>

      <div className="bg-[#112] p-4 border-4 border-blue-900 shadow-[0_0_20px_rgba(0,0,255,0.5)]">
        <div className="flex gap-2 mb-2 h-8">
            {Array(COLS).fill(0).map((_, c) => (
                <div key={`arrow-${c}`} className={`w-12 h-8 flex justify-center items-center text-white ${hoverCol === c && !winner ? 'opacity-100' : 'opacity-0'}`}>
                    ↓
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {board.map((row, r) => 
            row.map((cell, c) => (
              <div 
                key={`${r}-${c}`}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                onClick={() => handleColumnClick(c)}
                className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-[var(--color-arcade-bg)] flex items-center justify-center cursor-pointer shadow-inner"
              >
                {cell === 1 && <div className="w-8 h-8 md:w-14 md:h-14 rounded-full bg-[var(--color-neon-cyan)] box-shadow-cyan"></div>}
                {cell === 2 && <div className="w-8 h-8 md:w-14 md:h-14 rounded-full bg-[var(--color-neon-lime)] box-shadow-lime"></div>}
              </div>
            ))
          )}
        </div>
      </div>

      {winner && (
        <div className="mt-8 text-center">
          <h2 className="font-retro text-3xl text-white blink mb-4">
            {winner === 'DRAW' ? 'DRAW!' : `PLAYER ${winner} WINS!`}
          </h2>
          <RetroButton onClick={() => { setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null))); setWinner(null); setTurn(1); }}>PLAY AGAIN</RetroButton>
        </div>
      )}

      <div className="mt-auto pt-8">
        <RetroButton onClick={() => changeScene('GAME_SELECT')}>BACK</RetroButton>
      </div>
    </div>
  );
}
