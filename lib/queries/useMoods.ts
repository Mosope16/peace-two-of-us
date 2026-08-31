import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';
import { MoodLog, MoodType } from '@/types';

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function getLocalMoods(coupleId: string): MoodLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`ldr_moods_${coupleId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local moods:', e);
  }
  return [];
}

function setLocalMoods(coupleId: string, moods: MoodLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ldr_moods_${coupleId}`, JSON.stringify(moods));
  } catch (e) {
    console.error('Error writing local moods:', e);
  }
}

export function useMoods() {
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';
  const currentUser = useLDRStore((state) => state.currentUser);
  const partner = useLDRStore((state) => state.partner);

  return useQuery({
    queryKey: ['moods', coupleId],
    queryFn: async () => {
      const userIds = [currentUser?.id, partner?.id].filter((id): id is string => Boolean(id) && isValidUUID(id));

      // 1. Try Supabase if configured and valid user UUIDs exist
      if (isSupabaseConfigured() && userIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from('moods')
            .select('*')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(20);

          if (!error && data) {
            setLocalMoods(coupleId, data as MoodLog[]);
            return data as MoodLog[];
          }
        } catch (e) {
          console.warn('Supabase fetch moods failed, using local cache:', e);
        }
      }

      // 2. Fallback to Local Storage
      const local = getLocalMoods(coupleId);
      if (local.length > 0) return local;

      // Default sample partner mood
      const defaultMoods: MoodLog[] = [
        {
          id: 'sample-mood-1',
          user_id: partner?.id || 'user-partner-2',
          mood: 'loved',
          note: 'Missing you today ❤️',
          created_at: new Date().toISOString(),
        },
      ];
      setLocalMoods(coupleId, defaultMoods);
      return defaultMoods;
    },
    enabled: true,
  });
}

export function useSetMood() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id) || 'couple-space-1';
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (moodData: { mood: MoodType | string; note?: string }) => {
      if (!user) throw new Error('Missing user');

      const newMoodLog: MoodLog = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mood-${Date.now()}`,
        user_id: user.id,
        mood: moodData.mood as MoodType,
        note: moodData.note,
        created_at: new Date().toISOString(),
      };

      // 1. Instant Realtime Broadcast to Partner's Screen
      try {
        const roomChannel = supabase.channel(`couple-room-${coupleId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'mood_updated',
          payload: newMoodLog,
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }

      // 2. Persist to Supabase if valid UUID
      if (isSupabaseConfigured() && isValidUUID(user.id)) {
        try {
          const insertPayload: any = {
            user_id: user.id,
            mood: moodData.mood,
          };
          if (moodData.note) {
            insertPayload.note = moodData.note;
          }

          const { data, error } = await supabase
            .from('moods')
            .insert(insertPayload)
            .select()
            .single();

          if (!error && data) {
            newMoodLog.id = data.id;
          } else if (error) {
            console.warn('Supabase mood insert warning (persisted locally):', error.message);
          }
        } catch (err) {
          console.warn('Supabase network error saving mood:', err);
        }
      }

      // 3. Always persist locally
      const currentList = getLocalMoods(coupleId);
      const updatedList = [newMoodLog, ...currentList.filter((m) => m.id !== newMoodLog.id)];
      setLocalMoods(coupleId, updatedList);

      return newMoodLog;
    },
    onMutate: async (newMoodData) => {
      await queryClient.cancelQueries({ queryKey: ['moods', coupleId] });
      const previous = queryClient.getQueryData<MoodLog[]>(['moods', coupleId]) || [];

      const optimisticLog: MoodLog = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || 'user-1',
        mood: newMoodData.mood as MoodType,
        note: newMoodData.note,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MoodLog[]>(['moods', coupleId], [
        optimisticLog,
        ...previous.filter((m) => m.user_id !== user?.id),
      ]);

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['moods', coupleId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['moods', coupleId] });
    },
  });
}
