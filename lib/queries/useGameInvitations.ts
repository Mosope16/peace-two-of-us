import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';

export type GameInvitation = {
  id: string;
  couple_id: string;
  game_type: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
};

export function useGameInvitations() {
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);

  return useQuery({
    queryKey: ['game_invitations', coupleId],
    queryFn: async () => {
      if (!coupleId || !user) return [];
      const { data, error } = await supabase
        .from('game_invitations')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GameInvitation[];
    },
    enabled: !!coupleId && !!user,
  });
}

export function useSendGameInvitation() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);
  const partner = useLDRStore((state) => state.partner);
  const isConnected = useLDRStore((state) => state.couple?.is_connected);

  return useMutation({
    mutationFn: async (gameType: string) => {
      if (!coupleId || !user || !partner || !isConnected) {
        throw new Error('Cannot send invite: Your partner has not joined this couple yet.');
      }
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const { data, error } = await supabase
        .from('game_invitations')
        .insert({
          couple_id: coupleId,
          game_type: gameType,
          sender_id: user.id,
          receiver_id: partner.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error sending invite:', error);
        throw error;
      }
      return data as GameInvitation;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_invitations', coupleId] });
    },
  });
}

export function useAcceptGameInvitation() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('accept_game_invitation', { invite_id: invitationId });
      if (error) throw error;
      return data as string; // returns session_id
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_invitations', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['game_sessions', coupleId] });
    }
  });
}

export function useDeclineGameInvitation() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('game_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);
      if (error) throw error;
      return invitationId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_invitations', coupleId] });
    }
  });
}
