import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { LoveLetter } from '@/types';

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function getLocalLetters(coupleId: string): LoveLetter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`ldr_letters_${coupleId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local letters:', e);
  }
  return [];
}

function setLocalLetters(coupleId: string, letters: LoveLetter[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ldr_letters_${coupleId}`, JSON.stringify(letters));
  } catch (e) {
    console.error('Error writing local letters:', e);
  }
}

export function useLoveLetters() {
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useQuery({
    queryKey: ['love_letters', coupleId],
    queryFn: async () => {
      // 1. Try Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const { data, error } = await supabase
            .from('love_letters')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setLocalLetters(coupleId, data as LoveLetter[]);
            return data as LoveLetter[];
          }
        } catch (e) {
          console.warn('Supabase fetch letters failed, using local cache:', e);
        }
      }

      // 2. Fallback to Local Storage
      const local = getLocalLetters(coupleId);
      if (local.length > 0) return local;

      // Default sample letter
      const defaultLetters: LoveLetter[] = [
        {
          id: 'sample-letter-1',
          couple_id: coupleId,
          title: 'A little note for when you miss me ❤️',
          content: 'No matter how many miles separate us, you are always in my thoughts and in my heart.',
          letter_style: 'romantic',
          created_by: 'user-partner-1',
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ];
      setLocalLetters(coupleId, defaultLetters);
      return defaultLetters;
    },
    enabled: true,
  });
}

export function useAddLoveLetter() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (letterData: Omit<LoveLetter, 'id' | 'created_at' | 'couple_id' | 'created_by' | 'is_read'>) => {
      const newLetter: LoveLetter = {
        ...letterData,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `letter-${Date.now()}`,
        couple_id: coupleId,
        created_by: user?.id || 'user-1',
        created_at: new Date().toISOString(),
        is_read: false,
      };

      // 1. Broadcast to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'letter_updated',
          payload: { action: 'add', letter: newLetter },
        });
      } catch (err) {
        console.warn('Broadcast letter error:', err);
      }

      // 2. Persist to Supabase if configured & valid UUID
      if (isSupabaseConfigured() && isValidUUID(coupleId)) {
        try {
          const insertPayload: any = {
            ...letterData,
            couple_id: coupleId,
          };
          if (user?.id && isValidUUID(user.id)) {
            insertPayload.created_by = user.id;
          }

          const { data, error } = await supabase
            .from('love_letters')
            .insert(insertPayload)
            .select()
            .single();

          if (!error && data) {
            newLetter.id = data.id;
          }
        } catch (err) {
          console.warn('Supabase save letter failed, persisted locally:', err);
        }
      }

      // 3. Persist locally
      const currentList = getLocalLetters(coupleId);
      const updatedList = [newLetter, ...currentList.filter((l) => l.id !== newLetter.id)];
      setLocalLetters(coupleId, updatedList);

      return newLetter;
    },
    onMutate: async (newLetter) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData<LoveLetter[]>(['love_letters', coupleId]) || [];

      const optimisticLetter: LoveLetter = {
        ...newLetter,
        id: `temp-${Date.now()}`,
        couple_id: coupleId,
        created_by: user?.id || 'user-1',
        created_at: new Date().toISOString(),
        is_read: false,
      };

      queryClient.setQueryData<LoveLetter[]>(['love_letters', coupleId], [optimisticLetter, ...previousLetters]);
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
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async (letterId: string) => {
      // 1. Broadcast delete to partner
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'letter_updated',
          payload: { action: 'delete', letterId },
        });
      } catch (err) {
        console.warn('Broadcast delete letter error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(letterId)) {
        try {
          await supabase.from('love_letters').delete().eq('id', letterId);
        } catch (e) {
          console.warn('Supabase delete letter failed:', e);
        }
      }

      // 3. Persist locally
      const currentList = getLocalLetters(coupleId);
      const updatedList = currentList.filter((l) => l.id !== letterId);
      setLocalLetters(coupleId, updatedList);

      return letterId;
    },
    onMutate: async (letterId) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData<LoveLetter[]>(['love_letters', coupleId]) || [];

      queryClient.setQueryData<LoveLetter[]>(
        ['love_letters', coupleId],
        previousLetters.filter((l) => l.id !== letterId)
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
    },
  });
}

export function useMarkLetterRead() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';

  return useMutation({
    mutationFn: async (letterId: string) => {
      if (isSupabaseConfigured() && isValidUUID(letterId)) {
        try {
          await supabase
            .from('love_letters')
            .update({ is_read: true })
            .eq('id', letterId);
        } catch (e) {
          console.warn('Supabase mark letter read failed:', e);
        }
      }

      const currentList = getLocalLetters(coupleId);
      const updatedList = currentList.map((l) => (l.id === letterId ? { ...l, is_read: true } : l));
      setLocalLetters(coupleId, updatedList);

      return letterId;
    },
    onMutate: async (letterId) => {
      await queryClient.cancelQueries({ queryKey: ['love_letters', coupleId] });
      const previousLetters = queryClient.getQueryData<LoveLetter[]>(['love_letters', coupleId]) || [];

      queryClient.setQueryData<LoveLetter[]>(
        ['love_letters', coupleId],
        previousLetters.map((l) => (l.id === letterId ? { ...l, is_read: true } : l))
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
    },
  });
}

