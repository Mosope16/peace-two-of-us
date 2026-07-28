import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { LoveLetter } from '@/types';

export function useLoveLetters() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['love_letters', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('love_letters')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoveLetter[];
    },
    enabled: !!coupleId,
  });
}

export function useAddLoveLetter() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (letterData: Omit<LoveLetter, 'id' | 'created_at' | 'couple_id' | 'created_by' | 'is_read'>) => {
      if (!coupleId || !user) throw new Error('Missing couple or user');
      
      const { data, error } = await supabase
        .from('love_letters')
        .insert({
          ...letterData,
          couple_id: coupleId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LoveLetter;
    },
    onMutate: async (newLetter) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData(['love_letters', coupleId]);

      queryClient.setQueryData(['love_letters', coupleId], (old: LoveLetter[] = []) => [
        {
          ...newLetter,
          id: `temp-${Date.now()}`,
          couple_id: coupleId,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          is_read: false,
        } as LoveLetter,
        ...old,
      ]);

      return { previousLetters };
    },
    onError: (err, newLetter, context) => {
      if (context?.previousLetters) {
        queryClient.setQueryData(['love_letters', coupleId], context.previousLetters);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['love_letters', coupleId] });
    },
  });
}

export function useDeleteLoveLetter() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (letterId: string) => {
      const { error } = await supabase.from('love_letters').delete().eq('id', letterId);
      if (error) throw error;
      return letterId;
    },
    onMutate: async (letterId) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData(['love_letters', coupleId]);

      queryClient.setQueryData(['love_letters', coupleId], (old: LoveLetter[] = []) => 
        old.filter(l => l.id !== letterId)
      );

      return { previousLetters };
    },
    onError: (err, letterId, context) => {
      if (context?.previousLetters) {
        queryClient.setQueryData(['love_letters', coupleId], context.previousLetters);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['love_letters', coupleId] });
    }
  });
}

export function useMarkLetterRead() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (letterId: string) => {
      const { error } = await supabase
        .from('love_letters')
        .update({ is_read: true })
        .eq('id', letterId);
      if (error) throw error;
      return letterId;
    },
    onMutate: async (letterId) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData(['love_letters', coupleId]);

      queryClient.setQueryData(['love_letters', coupleId], (old: LoveLetter[] = []) => 
        old.map(l => l.id === letterId ? { ...l, is_read: true } : l)
      );

      return { previousLetters };
    },
    onError: (err, letterId, context) => {
      if (context?.previousLetters) {
        queryClient.setQueryData(['love_letters', coupleId], context.previousLetters);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['love_letters', coupleId] });
    }
  });
}
