import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { MoodLog } from '@/types';

export function useMoods() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['moods', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      // To get the latest mood for each user in the couple, we can just fetch all moods for the couple 
      // or we can fetch the latest mood for the partner.
      // Since our RLS allows viewing moods of anyone in the couple:
      const { data, error } = await supabase
        .from('moods')
        .select('*, users!inner(couple_id)')
        .eq('users.couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as MoodLog[];
    },
    enabled: !!coupleId,
  });
}

export function useSetMood() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (moodData: { mood: string; note?: string }) => {
      if (!user) throw new Error('Missing user');
      
      const { data, error } = await supabase
        .from('moods')
        .insert({
          user_id: user.id,
          mood: moodData.mood,
          note: moodData.note
        })
        .select()
        .single();

      if (error) throw error;
      return data as MoodLog;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['moods', coupleId] });
    },
  });
}
