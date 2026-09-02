'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PlayerState = 'playing' | 'paused' | 'buffering' | 'ended';

export interface WatchEvent {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'REACTION';
  senderId: string;
  position?: number;
  playerState?: PlayerState;
  timestamp?: number;
  reaction?: string;
}

export interface PartnerPresence {
  userId: string;
  online: boolean;
  watching: boolean;
  position?: number;
  playerState?: PlayerState;
  joinedAt?: number;
}

export function useWatchSync(sessionId: string | undefined, userId: string | undefined) {
  const [incomingEvent, setIncomingEvent] = useState<WatchEvent | null>(null);
  const [partnerPresence, setPartnerPresence] = useState<PartnerPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId || !userId || !isSupabaseConfigured()) {
      return;
    }

    const channelName = `watch:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false,
        },
        presence: {
          key: userId,
        },
      },
    });

    // 1. Broadcast Listener
    channel.on(
      'broadcast',
      { event: 'watch_event' },
      ({ payload }: { payload: WatchEvent }) => {
        if (!payload || payload.senderId === userId) return;
        setIncomingEvent(payload);
      }
    );

    // 2. Presence Tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let foundPartner: PartnerPresence | null = null;

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId && p.userId !== userId) {
              foundPartner = p as PartnerPresence;
            }
          });
        });

        setPartnerPresence(foundPartner);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        if (leftPresences.some((p) => p.userId !== userId)) {
          setPartnerPresence(null);
        }
      });

    // 3. Subscribe & Track
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        try {
          await channel.track({
            userId,
            online: true,
            watching: true,
            joinedAt: Date.now(),
          });
        } catch (err) {
          console.warn('[useWatchSync] Presence track error:', err);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      setIsConnected(false);
      setPartnerPresence(null);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, userId]);

  const broadcast = useCallback(
    async (event: WatchEvent) => {
      if (!channelRef.current) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'watch_event',
          payload: {
            ...event,
            senderId: userId || event.senderId,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.warn('[useWatchSync] Broadcast error:', err);
      }
    },
    [userId]
  );

  const updatePresenceState = useCallback(
    async (details: { position?: number; playerState?: PlayerState }) => {
      if (!channelRef.current || !userId) return;
      try {
        await channelRef.current.track({
          userId,
          online: true,
          watching: true,
          ...details,
        });
      } catch (err) {
        // non-blocking
      }
    },
    [userId]
  );

  return {
    incomingEvent,
    partnerPresence,
    isConnected,
    broadcast,
    updatePresenceState,
    channel: channelRef.current,
  };
}

