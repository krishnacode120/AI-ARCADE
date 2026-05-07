import React from 'react';

interface Props {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Panel: React.FC<Props> = ({ children, title, className = '' }) => {
  return (
    <div className={`border-4 border-[#333] p-6 relative bg-[#0f0f0f] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] ${className}`}>
      {title && (
        <div className="mb-4 flex items-baseline gap-4 mt-2">
           <h2 className="text-2xl md:text-3xl font-pixel text-[var(--color-neon-magenta)] text-shadow-magenta uppercase tracking-widest">
             {title}
           </h2>
           <span className="h-1 flex-1 border-b-2 border-dashed border-[#333]"></span>
        </div>
      )}
      {children}
    </div>
  );
};
