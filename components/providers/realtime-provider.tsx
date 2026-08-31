'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { syncClerkUser } from '@/lib/clerk-sync';
import { Countdown, BucketItem, LoveLetter, MoodLog } from '@/types';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);
  const setAuthenticatedUser = useLDRStore((state) => state.setAuthenticatedUser);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!coupleId || !user) return;

    // Helper to debounce user/couple re-sync
    const triggerProfileSync = () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncClerkUser()
          .then(({ user: appUser, partner, couple }) => {
            setAuthenticatedUser(appUser, partner, couple);
          })
          .catch((err) => {
            console.warn('Realtime profile sync note:', err?.message || err);
          });
      }, 300);
    };

    // 1. Subscribe to Love Letters
    const lettersSub = supabase
      .channel(`realtime:letters:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'love_letters', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['love_letters'] });
        }
      )
      .subscribe();

    // 2. Subscribe to Notifications
    const notificationsSub = supabase
      .channel(`realtime:notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    // 3. Subscribe to Game Invitations
    const gameInvitesSub = supabase
      .channel(`realtime:game_invitations:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_invitations', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['game_invitations'] });
        }
      )
      .subscribe();

    // 4. Subscribe to Game Sessions
    const gameSessionsSub = supabase
      .channel(`realtime:game_sessions:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['game_sessions'] });
        }
      )
      .subscribe();

    // 5. Subscribe to Countdowns
    const countdownsSub = supabase
      .channel(`realtime:countdowns:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'countdowns', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['countdowns'] });
        }
      )
      .subscribe();

    // 6. Subscribe to Bucket List
    const bucketSub = supabase
      .channel(`realtime:bucket:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bucket_list', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bucket_list'] });
        }
      )
      .subscribe();

    // 7. Subscribe to Moods
    const moodsSub = supabase
      .channel(`realtime:moods:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moods' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['moods'] });
        }
      )
      .subscribe();

    // 8. Subscribe to Couples (When partner connects or relationship date changes)
    const coupleSub = supabase
      .channel(`realtime:couple_pairing:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => {
          triggerProfileSync();
        }
      )
      .subscribe();

    // 9. Subscribe to Users (When partner updates avatar, name, location, timezone)
    const usersSub = supabase
      .channel(`realtime:users:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `couple_id=eq.${coupleId}` },
        () => {
          triggerProfileSync();
        }
      )
      .subscribe();

    // 10. Instant Broadcast Room for Sub-50ms Reactivity Across All Tabs
    const coupleRoomBroadcast = supabase
      .channel(`couple-room-${coupleId}`)
      .on('broadcast', { event: 'mood_updated' }, ({ payload }) => {
        if (payload) {
          queryClient.setQueryData<MoodLog[]>(['moods', coupleId], (old = []) => [
            payload,
            ...old.filter((m) => m.id !== payload.id && m.user_id !== payload.user_id),
          ]);
          queryClient.invalidateQueries({ queryKey: ['moods'] });
        }
      })
      .on('broadcast', { event: 'bucket_updated' }, ({ payload }) => {
        if (!payload) return;
        queryClient.setQueryData<BucketItem[]>(['bucket_list', coupleId], (old = []) => {
          if (payload.action === 'add' && payload.item) {
            return [payload.item, ...old.filter((b) => b.id !== payload.item.id)];
          }
          if (payload.action === 'toggle') {
            return old.map((b) =>
              b.id === payload.id ? { ...b, completed: payload.completed, completed_at: payload.completed_at } : b
            );
          }
          if (payload.action === 'delete') {
            return old.filter((b) => b.id !== payload.id);
          }
          return old;
        });
        queryClient.invalidateQueries({ queryKey: ['bucket_list'] });
      })
      .on('broadcast', { event: 'countdown_updated' }, ({ payload }) => {
        if (!payload) return;
        queryClient.setQueryData<Countdown[]>(['countdowns', coupleId], (old = []) => {
          if (payload.action === 'add' && payload.item) {
            return [...old.filter((c) => c.id !== payload.item.id), payload.item].sort(
              (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
            );
          }
          if (payload.action === 'update') {
            return old.map((c) => (c.id === payload.id ? { ...c, ...payload.updates } : c));
          }
          if (payload.action === 'delete') {
            return old.filter((c) => c.id !== payload.id);
          }
          return old;
        });
        queryClient.invalidateQueries({ queryKey: ['countdowns'] });
      })
      .on('broadcast', { event: 'letter_updated' }, ({ payload }) => {
        if (!payload) return;
        queryClient.setQueryData<LoveLetter[]>(['love_letters', coupleId], (old = []) => {
          if (payload.action === 'add' && payload.letter) {
            return [payload.letter, ...old.filter((l) => l.id !== payload.letter.id)];
          }
          if (payload.action === 'delete') {
            return old.filter((l) => l.id !== payload.letterId);
          }
          return old;
        });
        queryClient.invalidateQueries({ queryKey: ['love_letters'] });
      })
      .on('broadcast', { event: 'partner_connected' }, () => {
        triggerProfileSync();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lettersSub);
      supabase.removeChannel(notificationsSub);
      supabase.removeChannel(gameInvitesSub);
      supabase.removeChannel(gameSessionsSub);
      supabase.removeChannel(countdownsSub);
      supabase.removeChannel(bucketSub);
      supabase.removeChannel(moodsSub);
      supabase.removeChannel(coupleSub);
      supabase.removeChannel(usersSub);
      supabase.removeChannel(coupleRoomBroadcast);
    };
  }, [coupleId, user, queryClient, setAuthenticatedUser]);

  return <>{children}</>;
}
