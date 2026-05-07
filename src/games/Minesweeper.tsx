import React, { useState, useEffect } from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';
import { useStats, useGlobalUI } from '../store';
import { soundManager } from '../lib/sound';

interface Props {
  config: { difficulty: string };
  changeScene: (scene: string) => void;
}

type Cell = {
  r: number;
  c: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export default function Minesweeper({ config, changeScene }: Props) {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const { addGameResult } = useStats();
  const { shakeScreen } = useGlobalUI();

  let ROWS = 8;
  let COLS = 8;
  let MINES = 10;
  if (config.difficulty === 'Normal') { ROWS = 10; COLS = 10; MINES = 15; }
  if (config.difficulty === 'Hard') { ROWS = 12; COLS = 12; MINES = 25; }

  useEffect(() => {
    initBoard();
  }, [config.difficulty]);

  const initBoard = () => {
    let newBoard: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      let row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ r, c, isMine: false, isOpen: false, isFlagged: false, neighborMines: 0 });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameOver(false);
    setWin(false);
  };

  const placeMines = (firstR: number, firstC: number, boardData: Cell[][]) => {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      // Avoid placing mine on first click
      if (!boardData[r][c].isMine && !(r === firstR && c === firstC)) {
        boardData[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calc neighbors
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!boardData[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS) {
                if (boardData[r + dr][c + dc].isMine) count++;
              }
            }
          }
          boardData[r][c].neighborMines = count;
        }
      }
    }
  };

  const openCell = (r: number, c: number) => {
    if (gameOver || win) return;
    if (board[r][c].isOpen || board[r][c].isFlagged) return;

    let b = board.map(row => row.map(cell => ({ ...cell })));

    // First click?
    const isFirstClick = b.every(row => row.every(cell => !cell.isOpen));
    if (isFirstClick) {
      placeMines(r, c, b);
    }

    if (b[r][c].isMine) {
      // BOOM
      b[r][c].isOpen = true;
      setBoard(b);
      setGameOver(true);
      soundManager.loss();
      shakeScreen();
      addGameResult('loss');
      // Reveal all mines
      setBoard(prev => prev.map(row => row.map(cell => cell.isMine ? { ...cell, isOpen: true } : cell)));
      return;
    }

    soundManager.move();
    
    // Flood fill algorithm to open empty cells
    const stack = [{ r, c }];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (!b[curr.r][curr.c].isOpen) {
        b[curr.r][curr.c].isOpen = true;
        if (b[curr.r][curr.c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              let nr = curr.r + dr;
              let nc = curr.c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !b[nr][nc].isOpen && !b[nr][nc].isMine) {
                stack.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }

    setBoard(b);

    // Check Win
    let openCount = 0;
    b.forEach(row => row.forEach(cell => { if (cell.isOpen) openCount++; }));
    if (openCount === ROWS * COLS - MINES) {
      setWin(true);
      soundManager.win();
      addGameResult('win');
    }
  };

  const toggleFlag = (r: number, c: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (gameOver || win || board[r][c].isOpen) return;
    soundManager.click();
    let b = board.map(row => [...row]);
    b[r][c] = { ...b[r][c], isFlagged: !b[r][c].isFlagged };
    setBoard(b);
  };

  const handleCellClick = (r: number, c: number, e: React.MouseEvent | React.TouchEvent) => {
    if (flagMode) {
        toggleFlag(r, c, e);
    } else {
        openCell(r, c);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-full">
      <div className="flex justify-between w-full max-w-xl mb-4 mt-8 items-center">
        <h2 className="text-2xl md:text-3xl text-[var(--color-neon-magenta)] text-shadow-magenta">MINESWEEPER</h2>
        <div className="flex gap-2 items-center">
            <span className="text-[var(--color-neon-lime)] text-xl">
                {MINES - board.flat().filter(c => c.isFlagged).length} 🚩
            </span>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <RetroButton active={!flagMode} onClick={() => setFlagMode(false)}>DIG</RetroButton>
        <RetroButton active={flagMode} onClick={() => setFlagMode(true)}>FLAG</RetroButton>
      </div>

      <div 
        className="bg-[#111] p-2 md:p-4 rounded-md border-4 border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)] inline-block"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gap: '2px',
          WebkitUserSelect: 'none',
          TouchAction: 'manipulation' // prevents double tap zoom on mobile
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={(e) => handleCellClick(r, c, e)}
              onContextMenu={(e) => toggleFlag(r, c, e)}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-lg md:text-xl cursor-pointer border ${
                cell.isOpen 
                  ? 'bg-[#222] border-[#111]' 
                  : 'bg-[#444] border-t-[#666] border-l-[#666] border-b-[#222] border-r-[#222] hover:bg-[#555]'
              }`}
            >
              {cell.isOpen ? (
                cell.isMine ? <span className="drop-shadow-[0_0_5px_red]">💣</span> : 
                cell.neighborMines > 0 ? (
                    <span style={{
                        color: ['#aaa', '#00f', '#0f0', '#f00', '#00008b', '#8b0000', '#008b8b', '#000', '#808080'][cell.neighborMines]
                    }}>
                        {cell.neighborMines}
                    </span>
                ) : ''
              ) : cell.isFlagged ? (
                <span className="drop-shadow-[0_0_5px_var(--color-neon-magenta)]">🚩</span>
              ) : ''}
            </div>
          ))
        )}
      </div>

       <div className="h-16 mt-4 flex items-center justify-center">
        {(gameOver || win) ? (
           <div className="flex flex-col md:flex-row gap-4 items-center">
             <h2 className={`text-2xl ${win ? 'text-[var(--color-neon-lime)] text-shadow-lime' : 'text-red-500'}`}>
               {win ? 'SECTOR CLEARED!' : 'BOOM! YOU FAILED.'}
             </h2>
             <RetroButton onClick={initBoard}>PLAY AGAIN</RetroButton>
           </div>
        ) : (
            <div className="opacity-50 text-sm">Long press or right click to flag</div>
        )}
      </div>

      <div className="mt-8">
        <RetroButton onClick={() => changeScene('GAME_SELECT')}>BACK TO MENU</RetroButton>
      </div>
    </div>
  );
}
