import React, { useState, useEffect } from 'react';
import { RetroButton } from '../components/RetroButton';
import { useStats } from '../store';
import { soundManager } from '../lib/sound';

interface Props {
  config: { difficulty: string };
  changeScene: (scene: string) => void;
}

type Card = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const SYMBOLS = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆'];

export default function Memory({ config, changeScene }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIdxs, setFlippedIdxs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { addGameResult } = useStats();

  const isHard = config.difficulty !== 'Easy';
  const PAIRS = isHard ? 12 : 8; // 24 cards vs 16 cards

  useEffect(() => {
    initGame();
  }, [config.difficulty]);

  const initGame = () => {
    const selectedSymbols = SYMBOLS.slice(0, PAIRS);
    const deck = [...selectedSymbols, ...selectedSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({
        id: idx,
        symbol,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(deck);
    setFlippedIdxs([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
  };

  const handleCardClick = (index: number) => {
    if (gameOver) return;
    if (flippedIdxs.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    soundManager.move();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIdxs, index];
    setFlippedIdxs(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (newCards[first].symbol === newCards[second].symbol) {
        // Match
        soundManager.win(); // little chime
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedIdxs([]);
          
          if (matches + 1 === PAIRS) {
            setGameOver(true);
            setTimeout(() => {
                soundManager.win();
                addGameResult('win'); // Consider memory always a win if finished
            }, 500);
          } else {
            setMatches(m => m + 1);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedIdxs([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-full">
      <div className="flex justify-between w-full max-w-2xl mb-8 mt-4 items-center px-4">
        <h2 className="text-2xl md:text-3xl text-[var(--color-neon-cyan)] text-shadow-cyan">MEMORY MATCH</h2>
        <span className="text-xl text-[var(--color-neon-lime)]">MOVES: {moves}</span>
      </div>

      <div className={`grid gap-2 md:gap-4 ${isHard ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-4'}`}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-4xl cursor-pointer rounded-sm border-2 transition-transform duration-300 transform-gpu ${
              card.isFlipped || card.isMatched
                ? 'bg-[#222] border-[var(--color-neon-cyan)] shadow-[inset_0_0_15px_rgba(0,240,255,0.2)] rotate-y-180'
                : 'bg-[#111] border-[#444] hover:border-[var(--color-neon-magenta)]'
            }`}
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
             {/* Simple flip implementation via opacity for speed in this environment */}
            <span className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'} ${card.isMatched ? 'grayscale opacity-50' : ''}`}>
              {card.symbol}
            </span>
          </div>
        ))}
      </div>

      {gameOver && (
          <div className="mt-8 flex flex-col items-center">
              <h3 className="text-3xl text-[var(--color-neon-lime)] mb-4">BOARD CLEARED!</h3>
              <div className="flex gap-4">
                 <RetroButton onClick={initGame}>PLAY AGAIN</RetroButton>
                 <RetroButton onClick={() => changeScene('GAME_SELECT')}>MENU</RetroButton>
              </div>
          </div>
      )}

      {!gameOver && (
        <div className="mt-12">
            <RetroButton onClick={() => changeScene('GAME_SELECT')}>END GAME</RetroButton>
        </div>
      )}
    </div>
  );
}
