'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { MousePointer2 } from 'lucide-react';

interface Cursor {
  x: number;
  y: number;
  userId: string;
  name: string;
  lastUpdated: number;
}

export function LiveCursors({ channelName }: { channelName: string }) {
  const { currentUser } = useLDRStore();
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false }
      }
    });

    channel
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setCursors(prev => ({
            ...prev,
            [payload.userId]: {
              x: payload.x * window.innerWidth,
              y: payload.y * window.innerHeight,
              userId: payload.userId,
              name: payload.name,
              lastUpdated: Date.now()
            }
          }));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, currentUser]);

  // Clean up stale cursors (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (now - next[key].lastUpdated > 5000) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track mouse/touch moves
  useEffect(() => {
    if (!currentUser || !channelRef.current) return;

    let lastSent = 0;

    const handleMove = (clientX: number, clientY: number) => {
      const now = Date.now();
      // Throttle to 50ms (~20fps)
      if (now - lastSent < 50) return;
      
      const x = clientX / window.innerWidth;
      const y = clientY / window.innerHeight;

      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: currentUser.id,
          name: currentUser.name.split(' ')[0],
          x,
          y
        }
      });
      
      lastSent = now;
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <>
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="pointer-events-none fixed z-[9999] transition-all duration-100 ease-linear"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          <MousePointer2 className="w-6 h-6 text-rose-500 fill-rose-500 drop-shadow-md" style={{ transform: 'rotate(-10deg) translate(-2px, -2px)' }} />
          <div className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded mt-1 ml-4 shadow-lg shadow-rose-500/20 whitespace-nowrap">
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
}
