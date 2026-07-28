import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { BucketItem } from '@/types';

export function useBucketList() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['bucket_list', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('bucket_list')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BucketItem[];
    },
    enabled: !!coupleId,
  });
}

export function useAddBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (item: Partial<BucketItem>) => {
      const { data, error } = await supabase
        .from('bucket_list')
        .insert({
          ...item,
          couple_id: coupleId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BucketItem;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}

export function useToggleBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('bucket_list')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BucketItem;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}

export function useDeleteBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bucket_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}
