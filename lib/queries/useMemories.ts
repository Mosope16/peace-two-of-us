import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { Memory } from '@/types';

export function useMemories() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['memories', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!coupleId,
  });
}

export function useAddMemory() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (memoryData: Omit<Memory, 'id' | 'created_at' | 'couple_id' | 'created_by'>) => {
      if (!coupleId || !user) throw new Error('Missing couple or user');
      
      const { data, error } = await supabase
        .from('memories')
        .insert({
          ...memoryData,
          couple_id: coupleId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Memory;
    },
    onMutate: async (newMemory) => {
      await queryClient.cancelQueries({ queryKey: ['memories', coupleId] });
      const previousMemories = queryClient.getQueryData(['memories', coupleId]);

      queryClient.setQueryData(['memories', coupleId], (old: Memory[] = []) => [
        {
          ...newMemory,
          id: `temp-${Date.now()}`,
          couple_id: coupleId,
          created_by: user?.id,
          created_at: new Date().toISOString(),
        } as Memory,
        ...old,
      ]);

      return { previousMemories };
    },
    onError: (err, newMemory, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(['memories', coupleId], context.previousMemories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (memoryId: string) => {
      const { error } = await supabase.from('memories').delete().eq('id', memoryId);
      if (error) throw error;
      return memoryId;
    },
    onMutate: async (memoryId) => {
      await queryClient.cancelQueries({ queryKey: ['memories', coupleId] });
      const previousMemories = queryClient.getQueryData(['memories', coupleId]);

      queryClient.setQueryData(['memories', coupleId], (old: Memory[] = []) => 
        old.filter(m => m.id !== memoryId)
      );

      return { previousMemories };
    },
    onError: (err, memoryId, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(['memories', coupleId], context.previousMemories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
    }
  });
}
