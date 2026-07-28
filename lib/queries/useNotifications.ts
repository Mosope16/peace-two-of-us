import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const user = useLDRStore((state) => state.currentUser);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useLDRStore((state) => state.currentUser);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const prev = queryClient.getQueryData(['notifications', user?.id]);

      queryClient.setQueryData(['notifications', user?.id], (old: Notification[] = []) => 
        old.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );

      return { prev };
    },
    onError: (err, notificationId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['notifications', user?.id], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  });
}
