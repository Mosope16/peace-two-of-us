import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { Countdown } from '@/types';

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function getLocalCountdowns(coupleId: string): Countdown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`ldr_countdowns_${coupleId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local countdowns:', e);
  }
  return [];
}

function setLocalCountdowns(coupleId: string, countdowns: Countdown[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ldr_countdowns_${coupleId}`, JSON.stringify(countdowns));
  } catch (e) {
    console.error('Error writing local countdowns:', e);
  }
}

export function useCountdowns() {
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useQuery({
    queryKey: ['countdowns', coupleId],
    queryFn: async () => {
      // 1. If Supabase is configured and coupleId is a valid UUID, try fetching from Supabase
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const { data, error } = await supabase
            .from('countdowns')
            .select('*')
            .eq('couple_id', coupleId)
            .order('target_date', { ascending: true });

          if (!error && data) {
            setLocalCountdowns(coupleId, data as Countdown[]);
            return data as Countdown[];
          }
        } catch (e) {
          console.warn('Supabase fetch countdowns failed, falling back to local cache:', e);
        }
      }

      // 2. Fallback to Local Storage
      const local = getLocalCountdowns(coupleId);
      if (local.length > 0) return local;

      // Default sample countdown if none exists
      const defaultCountdown: Countdown = {
        id: 'sample-visit-1',
        couple_id: coupleId,
        title: 'Next Airport Reunion',
        target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
        category: 'visit',
        created_by: 'user-partner-1',
        created_at: new Date().toISOString(),
      };
      setLocalCountdowns(coupleId, [defaultCountdown]);
      return [defaultCountdown];
    },
    enabled: true,
  });
}

export function useAddCountdown() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';
  const currentUser = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (payload: { title: string; target_date: string; category?: Countdown['category']; created_by?: string }) => {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cd-${Date.now()}`;
      const newCountdown: Countdown = {
        id: newId,
        couple_id: coupleId,
        title: payload.title,
        target_date: payload.target_date,
        category: payload.category || 'visit',
        created_by: payload.created_by || currentUser?.id || 'user-1',
        created_at: new Date().toISOString(),
      };

      // 1. Broadcast to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'countdown_updated',
          payload: { action: 'add', item: newCountdown },
        });
      } catch (err) {
        console.warn('Broadcast countdown error:', err);
      }

      // 2. Try Supabase if valid UUID and configured
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const insertPayload: any = {
            title: payload.title,
            target_date: payload.target_date,
            category: payload.category || 'visit',
            couple_id: coupleId,
          };
          if (payload.created_by && isValidUUID(payload.created_by)) {
            insertPayload.created_by = payload.created_by;
          }

          let { data, error } = await supabase
            .from('countdowns')
            .insert(insertPayload)
            .select()
            .single();

          if (error && error.message.includes('category')) {
            delete insertPayload.category;
            const retryRes = await supabase.from('countdowns').insert(insertPayload).select().single();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (!error && data) {
            newCountdown.id = data.id;
          } else if (error) {
            console.warn('Supabase countdown insert warning (persisting locally):', error.message);
          }
        } catch (err) {
          console.warn('Supabase network error, saving locally:', err);
        }
      }

      // 3. Always persist locally
      const currentList = getLocalCountdowns(coupleId);
      const updatedList = [...currentList, newCountdown].sort(
        (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      );
      setLocalCountdowns(coupleId, updatedList);

      return newCountdown;
    },
    onMutate: async (newPayload) => {
      await queryClient.cancelQueries({ queryKey: ['countdowns', coupleId] });
      const previous = queryClient.getQueryData<Countdown[]>(['countdowns', coupleId]) || [];

      const optimisticItem: Countdown = {
        id: `temp-${Date.now()}`,
        couple_id: coupleId,
        title: newPayload.title,
        target_date: newPayload.target_date,
        category: newPayload.category || 'visit',
        created_by: newPayload.created_by || currentUser?.id || 'user-1',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Countdown[]>(['countdowns', coupleId], [...previous, optimisticItem].sort(
        (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      ));

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['countdowns', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', coupleId] });
    },
  });
}

export function useUpdateCountdown() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Countdown> & { id: string }) => {
      // 1. Broadcast update to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'countdown_updated',
          payload: { action: 'update', id, updates },
        });
      } catch (err) {
        console.warn('Broadcast update countdown error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(id)) {
        try {
          await supabase.from('countdowns').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase update countdown failed:', e);
        }
      }

      // 3. Persist locally
      const currentList = getLocalCountdowns(coupleId);
      const updatedList = currentList.map((item) => (item.id === id ? { ...item, ...updates } : item));
      setLocalCountdowns(coupleId, updatedList);

      return { id, ...updates };
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['countdowns', coupleId] });
      const previous = queryClient.getQueryData<Countdown[]>(['countdowns', coupleId]) || [];

      queryClient.setQueryData<Countdown[]>(
        ['countdowns', coupleId],
        previous.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['countdowns', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', coupleId] });
    },
  });
}

export function useDeleteCountdown() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Broadcast delete to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'countdown_updated',
          payload: { action: 'delete', id },
        });
      } catch (err) {
        console.warn('Broadcast delete countdown error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(id)) {
        try {
          await supabase.from('countdowns').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete countdown failed:', e);
        }
      }

      // 3. Persist locally
      const currentList = getLocalCountdowns(coupleId);
      const updatedList = currentList.filter((item) => item.id !== id);
      setLocalCountdowns(coupleId, updatedList);

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['countdowns', coupleId] });
      const previous = queryClient.getQueryData<Countdown[]>(['countdowns', coupleId]) || [];

      queryClient.setQueryData<Countdown[]>(
        ['countdowns', coupleId],
        previous.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['countdowns', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', coupleId] });
    },
  });
}


