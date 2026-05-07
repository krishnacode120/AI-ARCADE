import React, { useState } from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';

interface Props {
  game: string;
  changeScene: (scene: string) => void;
  startGame: (config: { players: number; difficulty: string }) => void;
}

export default function GameSetup({ game, changeScene, startGame }: Props) {
  const [players, setPlayers] = useState(1);
  const [difficulty, setDifficulty] = useState('Normal');

  const gameNames: Record<string, string> = {
    'TIC_TAC_TOE': 'TIC TAC TOE',
    'CONNECT4': 'CONNECT 4',
    'SNAKE': 'SNAKE',
    'DOTS_BOXES': 'DOTS AND BOXES',
    'PONG': 'PONG',
    'SIMON': 'SIMON SAYS',
    'MINESWEEPER': 'MINESWEEPER',
    'MEMORY': 'MEMORY MATCH',
    'ASTEROIDS': 'ASTEROIDS',
    'TETRIS': 'TETRIS'
  };

  const gameInstructions: Record<string, string> = {
    'TIC_TAC_TOE': 'Align 3 matching symbols horizontally, vertically, or diagonally to win. If all 9 squares are filled without a winner, it is a draw.',
    'CONNECT4': 'Drop your colored discs into the columns. The first player to form a continuous line of 4 discs (horizontally, vertically, or diagonally) wins.',
    'SNAKE': 'Eat the glowing food to grow your snake and increase your score. Avoid hitting the walls or your own tail!',
    'DOTS_BOXES': 'Take turns drawing single horizontal or vertical lines between dots. Complete the fourth side of a 1x1 box to claim it and get another turn. Player with the most boxes wins.',
    'PONG': 'Deflect the ball past your opponent to score. First to score 5 points wins. P1 uses W/S keys, P2 uses Up/Down arrows.',
    'SIMON': 'Watch the sequence of glowing lights and sounds. Repeat the exact sequence back. Each round, an additional step is added. Test your memory!',
    'MINESWEEPER': 'Click to reveal parts of the grid. Numbers indicate how many mines are adjacent. Flag suspected mines by right-clicking. Reveal all safe squares to win.',
    'MEMORY': 'Flip tiles two at a time to find matching symbol pairs. Minimize the number of moves to get a perfect score.',
    'ASTEROIDS': 'Use Left/Right arrows to rotate, Up arrow to thrust, and Space to shoot. Destroy asteroids to earn points. Watch out for smaller, faster asteroid fragments!',
    'TETRIS': 'Use Left/Right arrows to move, Up arrow to rotate, Down arrow for soft drop, and Space for hard drop. Clear lines to score points and increase the level.'
  };

  const singlePlayerOnly = ['SIMON', 'MINESWEEPER', 'MEMORY', 'SNAKE', 'ASTEROIDS', 'TETRIS'];
  const pvePvpGames = ['TIC_TAC_TOE', 'CONNECT4', 'DOTS_BOXES', 'PONG'];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="font-retro text-4xl text-[var(--color-neon-cyan)] text-shadow-cyan mb-8 text-center pt-8 md:pt-0">
        {gameNames[game]} SETUP
      </h1>

      <Panel className="w-full max-w-2xl mb-8 border-[var(--color-neon-lime)] shadow-[inset_0_0_10px_rgba(0,255,65,0.3)]">
        <h3 className="font-pixel text-[var(--color-neon-lime)] text-xl md:text-2xl mb-2 uppercase">HOW TO PLAY:</h3>
        <p className="font-pixel text-gray-300 text-lg md:text-xl leading-relaxed">{gameInstructions[game]}</p>
      </Panel>
      
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {pvePvpGames.includes(game) && (
            <Panel title="PLAYERS">
            <div className="flex flex-col md:flex-row gap-4 justify-around mt-4">
                <RetroButton active={players === 1} onClick={() => setPlayers(1)}>1 PLAYER (VS AI)</RetroButton>
                <RetroButton active={players === 2} onClick={() => setPlayers(2)}>2 PLAYERS (LOCAL)</RetroButton>
            </div>
            </Panel>
        )}

        {(players === 1 && !['SNAKE', 'SIMON', 'MEMORY'].includes(game)) && (
          <Panel title="AI DIFFICULTY">
            <div className="flex flex-col md:flex-row gap-4 justify-around mt-4">
              <RetroButton active={difficulty === 'Easy'} onClick={() => setDifficulty('Easy')}>EASY</RetroButton>
              <RetroButton active={difficulty === 'Normal'} onClick={() => setDifficulty('Normal')}>NORMAL</RetroButton>
              <RetroButton active={difficulty === 'Hard'} onClick={() => setDifficulty('Hard')}>HARD</RetroButton>
            </div>
          </Panel>
        )}

        {game === 'SNAKE' && (
          <Panel title="SPEED">
            <div className="flex flex-col md:flex-row gap-4 justify-around mt-4">
              <RetroButton active={difficulty === 'Easy'} onClick={() => setDifficulty('Easy')}>SLOW</RetroButton>
              <RetroButton active={difficulty === 'Normal'} onClick={() => setDifficulty('Normal')}>MEDIUM</RetroButton>
              <RetroButton active={difficulty === 'Hard'} onClick={() => setDifficulty('Hard')}>FAST</RetroButton>
            </div>
          </Panel>
        )}
        
        {game === 'MEMORY' && (
          <Panel title="GRID SIZE">
            <div className="flex flex-col md:flex-row gap-4 justify-around mt-4">
              <RetroButton active={difficulty === 'Easy'} onClick={() => setDifficulty('Easy')}>4x4</RetroButton>
              <RetroButton active={difficulty === 'Normal'} onClick={() => setDifficulty('Normal')}>4x6</RetroButton>
            </div>
          </Panel>
        )}

        {game === 'MINESWEEPER' && (
          <Panel title="DIFFICULTY">
            <div className="flex flex-col md:flex-row gap-4 justify-around mt-4">
              <RetroButton active={difficulty === 'Easy'} onClick={() => setDifficulty('Easy')}>EASY</RetroButton>
              <RetroButton active={difficulty === 'Normal'} onClick={() => setDifficulty('Normal')}>NORMAL</RetroButton>
              <RetroButton active={difficulty === 'Hard'} onClick={() => setDifficulty('Hard')}>HARD</RetroButton>
            </div>
          </Panel>
        )}

        <div className="flex justify-between mt-4">
          <RetroButton onClick={() => changeScene('GAME_SELECT')}>BACK</RetroButton>
          <RetroButton className="text-[var(--color-neon-lime)]" onClick={() => startGame({ players: singlePlayerOnly.includes(game) ? 1 : players, difficulty })}>START GAME</RetroButton>
        </div>
      </div>
    </div>
  );
}
