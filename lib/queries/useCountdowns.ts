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
