import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { BucketItem } from '@/types';

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function getLocalBucketList(coupleId: string): BucketItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`ldr_bucket_${coupleId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local bucket items:', e);
  }
  return [];
}

function setLocalBucketList(coupleId: string, items: BucketItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ldr_bucket_${coupleId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Error writing local bucket items:', e);
  }
}

export function useBucketList() {
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useQuery({
    queryKey: ['bucket_list', coupleId],
    queryFn: async () => {
      // 1. Try Supabase if configured and valid UUID
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const { data, error } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setLocalBucketList(coupleId, data as BucketItem[]);
            return data as BucketItem[];
          }
        } catch (e) {
          console.warn('Supabase fetch bucket list failed, using local cache:', e);
        }
      }

      // 2. Fallback to Local Storage
      const local = getLocalBucketList(coupleId);
      if (local.length > 0) return local;

      // Default starter items
      const defaultItems: BucketItem[] = [
        {
          id: 'sample-bucket-1',
          couple_id: coupleId,
          title: 'Watch the sunset together on a beach 🌅',
          description: 'A cozy evening listening to the waves',
          completed: false,
          category: 'travel',
          created_at: new Date().toISOString(),
        },
        {
          id: 'sample-bucket-2',
          couple_id: coupleId,
          title: 'Cook a 3-course dinner together on FaceTime 🍝',
          description: 'Make fresh pasta from scratch',
          completed: true,
          completed_at: new Date().toISOString(),
          category: 'date',
          created_at: new Date().toISOString(),
        },
      ];
      setLocalBucketList(coupleId, defaultItems);
      return defaultItems;
    },
    enabled: true,
  });
}

export function useAddBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (item: Partial<BucketItem>) => {
      const newItem: BucketItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bucket-${Date.now()}`,
        couple_id: coupleId,
        title: item.title || '',
        description: item.description || '',
        completed: false,
        category: item.category || 'travel',
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };

      // 1. Broadcast to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'bucket_updated',
          payload: { action: 'add', item: newItem },
        });
      } catch (err) {
        console.warn('Broadcast bucket error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const insertPayload: any = {
            title: newItem.title,
            description: newItem.description,
            completed: false,
            category: newItem.category,
            couple_id: coupleId,
          };
          if (user?.id && isValidUUID(user.id)) {
            insertPayload.created_by = user.id;
          }

          const { data, error } = await supabase
            .from('bucket_list')
            .insert(insertPayload)
            .select()
            .single();

          if (!error && data) {
            newItem.id = data.id;
          } else if (error) {
            console.warn('Supabase bucket insert warning (persisting locally):', error.message);
          }
        } catch (err) {
          console.warn('Supabase network error saving bucket item:', err);
        }
      }

      // 3. Persist locally
      const currentList = getLocalBucketList(coupleId);
      const updatedList = [newItem, ...currentList.filter((b) => b.id !== newItem.id)];
      setLocalBucketList(coupleId, updatedList);

      return newItem;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['bucket_list', coupleId] });
      const previous = queryClient.getQueryData<BucketItem[]>(['bucket_list', coupleId]) || [];

      const optimisticItem: BucketItem = {
        id: `temp-${Date.now()}`,
        couple_id: coupleId,
        title: newItem.title || '',
        description: newItem.description || '',
        completed: false,
        category: newItem.category || 'travel',
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<BucketItem[]>(['bucket_list', coupleId], [optimisticItem, ...previous]);
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bucket_list', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}

export function useToggleBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const completed_at = completed ? new Date().toISOString() : null;

      // 1. Broadcast toggle to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'bucket_updated',
          payload: { action: 'toggle', id, completed, completed_at },
        });
      } catch (err) {
        console.warn('Broadcast bucket error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(id)) {
        try {
          await supabase
            .from('bucket_list')
            .update({ completed, completed_at })
            .eq('id', id);
        } catch (e) {
          console.warn('Supabase toggle bucket item failed:', e);
        }
      }

      // 3. Persist locally
      const currentList = getLocalBucketList(coupleId);
      const updatedList = currentList.map((item) =>
        item.id === id ? { ...item, completed, completed_at: completed_at || undefined } : item
      );
      setLocalBucketList(coupleId, updatedList);

      return { id, completed, completed_at };
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['bucket_list', coupleId] });
      const previous = queryClient.getQueryData<BucketItem[]>(['bucket_list', coupleId]) || [];

      queryClient.setQueryData<BucketItem[]>(
        ['bucket_list', coupleId],
        previous.map((item) =>
          item.id === id ? { ...item, completed, completed_at: completed ? new Date().toISOString() : undefined } : item
        )
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bucket_list', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}

export function useDeleteBucketItem() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Broadcast delete to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'bucket_updated',
          payload: { action: 'delete', id },
        });
      } catch (err) {
        console.warn('Broadcast bucket error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(id)) {
        try {
          await supabase.from('bucket_list').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete bucket item failed:', e);
        }
      }

      // 3. Persist locally
      const currentList = getLocalBucketList(coupleId);
      const updatedList = currentList.filter((item) => item.id !== id);
      setLocalBucketList(coupleId, updatedList);

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bucket_list', coupleId] });
      const previous = queryClient.getQueryData<BucketItem[]>(['bucket_list', coupleId]) || [];

      queryClient.setQueryData<BucketItem[]>(
        ['bucket_list', coupleId],
        previous.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bucket_list', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket_list', coupleId] });
    },
  });
}

