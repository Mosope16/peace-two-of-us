'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.coupleId);
  const user = useLDRStore((state) => state.user);

  useEffect(() => {
    if (!coupleId || !user) return;

    // Subscribe to Memories
    const memoriesSub = supabase
      .channel('realtime:memories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['memories'] });
        }
      )
      .subscribe();

    // Subscribe to Letters
    const lettersSub = supabase
      .channel('realtime:love_letters')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'love_letters', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['love_letters'] });
        }
      )
      .subscribe();

    // Subscribe to Notifications
    const notificationsSub = supabase
      .channel('realtime:notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    // Subscribe to Game Invitations
    const gameInvitesSub = supabase
      .channel('realtime:game_invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_invitations', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['game_invitations'] });
        }
      )
      .subscribe();

    // Subscribe to Game Sessions
    const gameSessionsSub = supabase
      .channel('realtime:game_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['game_sessions'] });
        }
      )
      .subscribe();

    // Subscribe to Moods
    const moodsSub = supabase
      .channel('realtime:moods')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moods' }, // Moods are filtered by partner user_id in the component, but we can invalidate all moods
        () => {
          queryClient.invalidateQueries({ queryKey: ['moods'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memoriesSub);
      supabase.removeChannel(lettersSub);
      supabase.removeChannel(notificationsSub);
      supabase.removeChannel(gameInvitesSub);
      supabase.removeChannel(gameSessionsSub);
      supabase.removeChannel(moodsSub);
    };
  }, [coupleId, user, queryClient]);

  return <>{children}</>;
}
