import React, { useState } from 'react';
import { soundManager } from '../lib/sound';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const RetroButton: React.FC<Props> = ({ onClick, children, active, className = '', ...props }) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      onMouseEnter={() => {
        setHover(true);
        soundManager.hover();
      }}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        soundManager.click();
        if (onClick) onClick(e);
      }}
      className={`font-pixel text-2xl md:text-3xl px-4 py-2 flex items-center gap-4 uppercase tracking-wider transition-all duration-75 text-left
        ${active ? 'btn-active opacity-100' : 'text-[#f0f0f0] opacity-60 hover:opacity-100'}
        ${hover && !active ? 'text-[var(--color-neon-magenta)]' : ''}
        ${className}
      `}
      {...props}
    >
      <span className={`text-4xl ${hover || active ? 'visible' : 'invisible'}`}>{'>'}</span>
      <span className="tracking-wider">{children}</span>
    </button>
  );
};
