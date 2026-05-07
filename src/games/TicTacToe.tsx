import React, { useState, useEffect } from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';
import { soundManager } from '../lib/sound';
import { useStats } from '../store';

interface Props {
  config: { players: number; difficulty: string };
  changeScene: (scene: string) => void;
}

type Player = 'X' | 'O' | null;

export default function TicTacToe({ config, changeScene }: Props) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'DRAW'>(null);
  const { addGameResult } = useStats();

  const checkWinner = (squares: Player[]): { winner: Player | 'DRAW', line: number[] } | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (!squares.includes(null)) return { winner: 'DRAW', line: [] };
    return null;
  };

  const handleWin = (res: { winner: Player | 'DRAW', line: number[] }) => {
    setWinner(res.winner);
    if (res.winner === 'X') {
      soundManager.win();
      addGameResult('win'); // X is always p1
    } else if (res.winner === 'O') {
      soundManager.loss(); // If O wins, p1 lost
      addGameResult(config.players === 1 ? 'loss' : 'win');
      if (config.players === 1) {
        import('../store').then(({ useGlobalUI }) => useGlobalUI.getState().shakeScreen());
      }
    } else {
      soundManager.draw(); // draw sound
      addGameResult('draw');
    }
  };

  const makeMove = (index: number, player: 'X' | 'O') => {
    if (board[index] || winner) return false;
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    soundManager.move();
    
    const res = checkWinner(newBoard);
    if (res) {
      handleWin(res);
    } else {
      setTurn(player === 'X' ? 'O' : 'X');
    }
    return true;
  };

  const handleClick = (index: number) => {
    if (config.players === 1 && turn === 'O') return; // AI is thinking
    makeMove(index, turn);
  };

  // AI Move logic
  useEffect(() => {
    if (config.players === 1 && turn === 'O' && !winner) {
      const timer = setTimeout(() => {
        let moveIndex = -1;
        const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        
        if (config.difficulty === 'Easy') {
          moveIndex = available[Math.floor(Math.random() * available.length)];
        } else if (config.difficulty === 'Normal') {
          // Win, block win, or random
          let bestMove = -1;
          
          // 1. Check for immediate win
          for (let i of available) {
            const testBoard = [...board];
            testBoard[i] = 'O'; 
            if (checkWinner(testBoard)?.winner === 'O') {
              bestMove = i; break;
            }
          }
          
          // 2. Check to block immediate win
          if (bestMove === -1) {
            for (let i of available) {
              const testBoard = [...board];
              testBoard[i] = 'X'; 
              if (checkWinner(testBoard)?.winner === 'X') {
                bestMove = i; break;
              }
            }
          }
          
          if (bestMove !== -1) moveIndex = bestMove;
          else moveIndex = available[Math.floor(Math.random() * available.length)];
        } else {
          // Hard: Minimax (simplified for TTT)
          const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
            const res = checkWinner(squares);
            if (res?.winner === 'O') return 10 - depth;
            if (res?.winner === 'X') return depth - 10;
            if (res?.winner === 'DRAW') return 0;

            if (isMaximizing) {
              let bestScore = -Infinity;
              for (let i = 0; i < squares.length; i++) {
                if (!squares[i]) {
                  squares[i] = 'O';
                  let score = minimax(squares, depth + 1, false);
                  squares[i] = null;
                  bestScore = Math.max(score, bestScore);
                }
              }
              return bestScore;
            } else {
              let bestScore = Infinity;
              for (let i = 0; i < squares.length; i++) {
                if (!squares[i]) {
                  squares[i] = 'X';
                  let score = minimax(squares, depth + 1, true);
                  squares[i] = null;
                  bestScore = Math.min(score, bestScore);
                }
              }
              return bestScore;
            }
          };

          let bestScore = -Infinity;
          for (let i of available) {
            const newBoard = [...board];
            newBoard[i] = 'O';
            const score = minimax(newBoard, 0, false);
            if (score > bestScore) {
              bestScore = score;
              moveIndex = i;
            }
          }
        }
        
        if (moveIndex !== -1) makeMove(moveIndex, 'O');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, board, config]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-full">
      <h1 className="font-retro text-4xl text-[var(--color-neon-cyan)] text-shadow-cyan mb-8">TIC TAC TOE</h1>
      
      <div className="flex justify-between w-full max-w-sm font-pixel text-3xl mb-8">
        <span className={turn === 'X' ? 'text-[var(--color-neon-lime)] blink' : 'text-gray-500'}>PLAYER 1 (X)</span>
        <span className={turn === 'O' ? 'text-[var(--color-neon-magenta)] blink' : 'text-gray-500'}>
          {config.players === 1 ? 'AI (O)' : 'PLAYER 2 (O)'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[var(--color-neon-cyan)] p-2">
        {board.map((cell, i) => (
          <div 
            key={i} 
            onClick={() => handleClick(i)}
            className="w-24 h-24 md:w-32 md:h-32 bg-[var(--color-arcade-bg)] flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors"
          >
            <span className={`font-retro text-6xl md:text-8xl 
              ${cell === 'X' ? 'text-[var(--color-neon-lime)] text-shadow-lime' : ''}
              ${cell === 'O' ? 'text-[var(--color-neon-magenta)] text-shadow-magenta' : ''}
            `}>
              {cell}
            </span>
          </div>
        ))}
      </div>

      {winner && (
        <div className="mt-8 text-center">
          <h2 className="font-retro text-3xl text-white blink mb-4">
            {winner === 'DRAW' ? 'DRAW!' : `${winner} WINS!`}
          </h2>
          <RetroButton onClick={resetGame}>PLAY AGAIN</RetroButton>
        </div>
      )}

      <div className="mt-auto pt-8">
        <RetroButton onClick={() => changeScene('GAME_SELECT')}>BACK</RetroButton>
      </div>
    </div>
  );
}
