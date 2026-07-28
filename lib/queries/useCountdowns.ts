import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { Countdown } from '@/types';

export function useCountdowns() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['countdowns', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .eq('couple_id', coupleId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data as Countdown[];
    },
    enabled: !!coupleId,
  });
}

export function useAddCountdown() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (payload: Omit<Countdown, 'id' | 'created_at' | 'couple_id'> & { couple_id?: string }) => {
      const { data, error } = await supabase
        .from('countdowns')
        .insert({ ...payload, couple_id: payload.couple_id ?? coupleId })
        .select()
        .single();

      if (error) throw error;
      return data as Countdown;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', coupleId] });
    },
  });
}

export function useDeleteCountdown() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('countdowns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', coupleId] });
    },
  });
}
