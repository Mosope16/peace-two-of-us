'use client';

import React, { useEffect, useState } from 'react';

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

interface FloatingReactionsProps {
  incomingReaction: string | null;
}

export function FloatingReactions({ incomingReaction }: FloatingReactionsProps) {
  const [items, setItems] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    if (!incomingReaction) return;

    const newItem: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji: incomingReaction,
      left: Math.floor(Math.random() * 80) + 10, // 10% to 90%
    };

    setItems((prev) => [...prev, newItem]);

    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== newItem.id));
    }, 2400);

    return () => clearTimeout(timer);
  }, [incomingReaction]);

  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-10 text-3xl sm:text-4xl animate-float-fade"
          style={{ left: `${item.left}%` }}
        >
          {item.emoji}
        </div>
      ))}
      <style jsx>{`
        @keyframes floatFade {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 1;
          }
          50% {
            transform: translateY(-80px) scale(1.2);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-160px) scale(1.4);
            opacity: 0;
          }
        }
        .animate-float-fade {
          animation: floatFade 2.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

