import React, { useMemo } from 'react';

export default function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage start
      y: Math.random() * 50 - 50, // above screen
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 5}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="shooting-star"
          style={{
            left: `${star.x}vw`,
            top: `${star.y}vh`,
            animationDuration: star.animationDuration,
            animationDelay: star.animationDelay,
          }}
        ></div>
      ))}
    </div>
  );
}
