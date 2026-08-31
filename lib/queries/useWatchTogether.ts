'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { WatchSession, WatchMessage, WatchPlaybackEvent, WatchPresenceState } from '@/types';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Helper to extract YouTube video ID from various URL formats
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const clean = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = clean.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

// 1. Hook to Fetch Active Watch Session for the couple
export function useActiveWatchSession() {
  const { couple } = useLDRStore();
  const coupleId = couple?.id;

  return useQuery<WatchSession | null>({
    queryKey: ['watch_session_active', coupleId],
    queryFn: async () => {
      if (!coupleId || !isSupabaseConfigured()) return null;

      const { data, error } = await supabase
        .from('watch_sessions')
        .select('*')
        .eq('couple_id', coupleId)
        .in('status', ['created', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Could not load active watch session:', error.message);
        return null;
      }
      return data as WatchSession | null;
    },
    enabled: !!coupleId,
    refetchInterval: 5000, // Background sync fallback
  });
}

// 2. Hook to Fetch Specific Watch Session
export function useWatchSession(sessionId: string | undefined) {
  return useQuery<WatchSession | null>({
    queryKey: ['watch_session', sessionId],
    queryFn: async () => {
      if (!sessionId || !isSupabaseConfigured()) return null;

      const { data, error } = await supabase
        .from('watch_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch watch session:', error.message);
        return null;
      }
      return data as WatchSession | null;
    },
    enabled: !!sessionId,
  });
}

// 3. Hook to Fetch Durable Watch Messages (Mini Chat)
export function useWatchMessages(sessionId: string | undefined) {
  return useQuery<WatchMessage[]>({
    queryKey: ['watch_messages', sessionId],
    queryFn: async () => {
      if (!sessionId || !isSupabaseConfigured()) return [];

      const { data, error } = await supabase
        .from('watch_messages')
        .select('*')
        .eq('watch_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not load watch messages:', error.message);
        return [];
      }
      return (data || []) as WatchMessage[];
    },
    enabled: !!sessionId,
  });
}

// 4. Mutation to Create a Watch Session
export function useCreateWatchSession() {
  const queryClient = useQueryClient();
  const { couple, currentUser } = useLDRStore();

  return useMutation({
    mutationFn: async ({
      urlOrId,
      title,
    }: {
      urlOrId: string;
      title?: string;
    }) => {
      const mediaId = extractYouTubeId(urlOrId);
      if (!mediaId) {
        throw new Error('Invalid YouTube URL or Video ID');
      }

      const sessionTitle = title?.trim() || `YouTube Video (${mediaId})`;
      const coupleId = couple?.id;
      const userId = currentUser?.id;

      if (!coupleId || !userId) {
        throw new Error('No active couple found. Please connect with your partner.');
      }

      // Close any previous active sessions first
      await supabase
        .from('watch_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('couple_id', coupleId)
        .in('status', ['created', 'active']);

      const newSession: Partial<WatchSession> = {
        couple_id: coupleId,
        created_by: userId,
        media_type: 'youtube',
        media_id: mediaId,
        title: sessionTitle,
        thumbnail_url: `https://img.youtube.com/vi/${mediaId}/hqdefault.jpg`,
        status: 'active',
        current_position: 0,
        is_playing: false,
        last_action_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('watch_sessions')
        .insert(newSession)
        .select('*')
        .single();

      if (error) {
        throw error;
      }
      return data as WatchSession;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(['watch_session_active', newSession.couple_id], newSession);
      queryClient.setQueryData(['watch_session', newSession.id], newSession);
    },
  });
}

// 5. Mutation to End a Watch Session
export function useEndWatchSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('watch_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select('*')
        .single();

      if (error) throw error;
      return data as WatchSession;
    },
    onSuccess: (endedSession) => {
      queryClient.setQueryData(['watch_session_active', endedSession.couple_id], null);
      queryClient.setQueryData(['watch_session', endedSession.id], endedSession);
    },
  });
}

// 6. Mutation to Update Durable Playback State (for recovery)
export function useUpdateWatchPlayback() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      position,
      isPlaying,
    }: {
      sessionId: string;
      position: number;
      isPlaying: boolean;
    }) => {
      await supabase
        .from('watch_sessions')
        .update({
          current_position: position,
          is_playing: isPlaying,
          last_action_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    },
  });
}

// 7. Mutation to Send a Chat Message
export function useSendWatchMessage() {
  const queryClient = useQueryClient();
  const { currentUser } = useLDRStore();

  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string;
      message: string;
    }) => {
      if (!currentUser?.id || !message.trim()) return null;

      const payload = {
        watch_session_id: sessionId,
        user_id: currentUser.id,
        message: message.trim(),
      };

      const { data, error } = await supabase
        .from('watch_messages')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as WatchMessage;
    },
    onSuccess: (newMessage, variables) => {
      if (!newMessage) return;
      queryClient.setQueryData<WatchMessage[]>(
        ['watch_messages', variables.sessionId],
        (old = []) => {
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        }
      );
    },
  });
}

// 8. Master Realtime Synchronization Engine
interface WatchRealtimeCallbacks {
  onPlay: (targetPosition: number, sequence: number) => void;
  onPause: (targetPosition: number, sequence: number) => void;
  onSeek: (targetPosition: number, sequence: number) => void;
  onSyncRequest: () => { position: number; isPlaying: boolean };
  onSyncResponse: (position: number, isPlaying: boolean, sequence: number) => void;
  onVideoChanged: (mediaId: string, title: string, sequence: number) => void;
  onReaction: (reaction: string, senderId: string) => void;
  onSessionEnded: () => void;
}

export function useWatchRealtimeEngine(
  sessionId: string | undefined,
  callbacks: WatchRealtimeCallbacks
) {
  const queryClient = useQueryClient();
  const { currentUser } = useLDRStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sequenceRef = useRef<number>(0);
  const lastProcessedSequenceRef = useRef<number>(0);
  const [partnerPresence, setPartnerPresence] = useState<WatchPresenceState | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'catching_up' | 'offline'>('synced');
  const [driftSeconds, setDriftSeconds] = useState<number>(0);

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const nextSequence = useCallback(() => {
    sequenceRef.current += 1;
    return sequenceRef.current;
  }, []);

  // Broadcast Helper Functions
  const broadcastPlay = useCallback(
    (position: number) => {
      if (!channelRef.current || !currentUser?.id) return;
      const seq = nextSequence();
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: {
          type: 'PLAY',
          position,
          sent_at: Date.now(),
          sequence: seq,
          sender_id: currentUser.id,
        } satisfies WatchPlaybackEvent,
      });
    },
    [currentUser?.id, nextSequence]
  );

  const broadcastPause = useCallback(
    (position: number) => {
      if (!channelRef.current || !currentUser?.id) return;
      const seq = nextSequence();
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: {
          type: 'PAUSE',
          position,
          sent_at: Date.now(),
          sequence: seq,
          sender_id: currentUser.id,
        } satisfies WatchPlaybackEvent,
      });
    },
    [currentUser?.id, nextSequence]
  );

  const broadcastSeek = useCallback(
    (position: number) => {
      if (!channelRef.current || !currentUser?.id) return;
      const seq = nextSequence();
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: {
          type: 'SEEK',
          position,
          sent_at: Date.now(),
          sequence: seq,
          sender_id: currentUser.id,
        } satisfies WatchPlaybackEvent,
      });
    },
    [currentUser?.id, nextSequence]
  );

  const broadcastSyncRequest = useCallback(() => {
    if (!channelRef.current || !currentUser?.id) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'playback',
      payload: {
        type: 'SYNC_REQUEST',
        sent_at: Date.now(),
        sender_id: currentUser.id,
      } satisfies WatchPlaybackEvent,
    });
  }, [currentUser?.id]);

  const broadcastVideoChange = useCallback(
    (mediaId: string, title: string) => {
      if (!channelRef.current || !currentUser?.id) return;
      const seq = nextSequence();
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: {
          type: 'VIDEO_CHANGED',
          media_id: mediaId,
          title,
          sent_at: Date.now(),
          sequence: seq,
          sender_id: currentUser.id,
        } satisfies WatchPlaybackEvent,
      });
    },
    [currentUser?.id, nextSequence]
  );

  const broadcastReaction = useCallback(
    (reaction: string) => {
      if (!channelRef.current || !currentUser?.id) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: {
          type: 'REACTION',
          reaction,
          sent_at: Date.now(),
          sender_id: currentUser.id,
        } satisfies WatchPlaybackEvent,
      });
    },
    [currentUser?.id]
  );

  const updatePresence = useCallback(
    (status: 'watching' | 'paused' | 'buffering', currentPosition: number) => {
      if (!channelRef.current || !currentUser) return;
      channelRef.current.track({
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_avatar: currentUser.avatar,
        status,
        current_position: currentPosition,
        online_at: new Date().toISOString(),
      });
    },
    [currentUser]
  );

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured() || !currentUser?.id) return;

    const channelName = `watch:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: currentUser.id },
      },
    });

    channelRef.current = channel;

    // 1. Broadcast Playback Listener
    channel.on(
      'broadcast',
      { event: 'playback' },
      ({ payload }: { payload: WatchPlaybackEvent }) => {
        if (!payload || payload.sender_id === currentUser.id) return;

        // Sequence number check (drop stale/out-of-order packets)
        if ('sequence' in payload && typeof payload.sequence === 'number') {
          if (payload.sequence <= lastProcessedSequenceRef.current) {
            return; // Drop old event
          }
          lastProcessedSequenceRef.current = payload.sequence;
        }

        const now = Date.now();
        const latencySec = Math.max(0, (now - payload.sent_at) / 1000);

        switch (payload.type) {
          case 'PLAY': {
            const adjustedPos = payload.position + latencySec;
            callbacksRef.current.onPlay(adjustedPos, payload.sequence);
            break;
          }
          case 'PAUSE': {
            callbacksRef.current.onPause(payload.position, payload.sequence);
            break;
          }
          case 'SEEK': {
            callbacksRef.current.onSeek(payload.position, payload.sequence);
            break;
          }
          case 'SYNC_REQUEST': {
            const currentStatus = callbacksRef.current.onSyncRequest();
            const seq = sequenceRef.current + 1;
            sequenceRef.current = seq;
            channel.send({
              type: 'broadcast',
              event: 'playback',
              payload: {
                type: 'SYNC_RESPONSE',
                position: currentStatus.position,
                is_playing: currentStatus.isPlaying,
                sent_at: Date.now(),
                sequence: seq,
                sender_id: currentUser.id,
                responder_id: currentUser.id,
                requester_id: payload.sender_id,
              } satisfies WatchPlaybackEvent,
            });
            break;
          }
          case 'SYNC_RESPONSE': {
            if (payload.requester_id === currentUser.id) {
              const adjustedPos = payload.is_playing ? payload.position + latencySec : payload.position;
              callbacksRef.current.onSyncResponse(adjustedPos, payload.is_playing, payload.sequence);
            }
            break;
          }
          case 'VIDEO_CHANGED': {
            callbacksRef.current.onVideoChanged(payload.media_id, payload.title, payload.sequence);
            break;
          }
          case 'REACTION': {
            callbacksRef.current.onReaction(payload.reaction, payload.sender_id);
            break;
          }
        }
      }
    );

    // 2. Presence Tracking Listener
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerStates: WatchPresenceState[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id && p.user_id !== currentUser.id) {
              partnerStates.push(p as WatchPresenceState);
            }
          });
        });

        if (partnerStates.length > 0) {
          setPartnerPresence(partnerStates[0]);
        } else {
          setPartnerPresence(null);
          setSyncStatus('offline');
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        if (leftPresences.some((p) => p.user_id !== currentUser.id)) {
          setPartnerPresence(null);
          setSyncStatus('offline');
        }
      });

    // 3. Postgres Changes for Durable Chat & Session State
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_messages',
          filter: `watch_session_id=eq.${sessionId}`,
        },
        (change) => {
          const newMsg = change.new as WatchMessage;
          queryClient.setQueryData<WatchMessage[]>(
            ['watch_messages', sessionId],
            (old = []) => {
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'watch_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (change) => {
          const updatedSession = change.new as WatchSession;
          queryClient.setQueryData(['watch_session', sessionId], updatedSession);
          if (updatedSession.status === 'ended') {
            callbacksRef.current.onSessionEnded();
          }
        }
      );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Initial presence track
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_avatar: currentUser.avatar,
          status: 'watching',
          current_position: 0,
          online_at: new Date().toISOString(),
        });
        // Request sync from partner
        broadcastSyncRequest();
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, currentUser?.id, broadcastSyncRequest, queryClient]);

  return {
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
    broadcastSyncRequest,
    broadcastVideoChange,
    broadcastReaction,
    updatePresence,
    partnerPresence,
    syncStatus,
    setSyncStatus,
    driftSeconds,
    setDriftSeconds,
  };
}
