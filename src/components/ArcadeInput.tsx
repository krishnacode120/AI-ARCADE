import React, { useState } from 'react';
import { RetroButton } from './RetroButton';

interface Props {
  onSubmit: (name: string) => void;
}

export const ArcadeInput: React.FC<Props> = ({ onSubmit }) => {
  const [name, setName] = useState('');

  return (
    <div className="flex flex-col items-center gap-2 mt-4 bg-black/80 p-4 border-2 border-[var(--color-neon-cyan)]">
      <div className="text-[var(--color-neon-magenta)] text-xl md:text-2xl uppercase font-pixel tracking-widest animate-pulse font-bold mb-2">NEW HIGH SCORE!</div>
      <input
        type="text"
        maxLength={10}
        autoFocus
        placeholder="ENTER NAME"
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase())}
        className="bg-[#111] border-2 border-[var(--color-neon-cyan)] text-[var(--color-neon-lime)] p-2 font-pixel text-2xl md:text-3xl text-center uppercase outline-none focus:border-[var(--color-neon-magenta)] focus:shadow-[0_0_10px_var(--color-neon-magenta)] w-64 max-w-full transition-all"
      />
      <div className="mt-4">
        {name.trim().length > 0 && (
          <RetroButton onClick={() => onSubmit(name.trim())}>SUBMIT</RetroButton>
        )}
      </div>
    </div>
  );
};
