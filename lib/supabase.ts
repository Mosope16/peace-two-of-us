import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://example.supabase.co';
};

import { User } from '@/types';

// Fetch Partner profile by ID
export async function fetchPartnerProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return data || null;
  } catch (e) {
    return null;
  }
}

// Realtime Listener for Couple Account Pairing
export function subscribeToCoupleRealtime(coupleId: string, onPartnerConnected: (partner: User) => void) {
  if (!isSupabaseConfigured() || !coupleId) return () => {};

  const channel = supabase
    .channel(`couple-pairing-${coupleId}-${Math.random().toString(36).substring(2, 9)}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
      async (payload) => {
        const updatedCouple = payload.new;
        if (updatedCouple && updatedCouple.partner_two) {
          const partnerObj = await fetchPartnerProfile(updatedCouple.partner_two);
          if (partnerObj) {
            onPartnerConnected(partnerObj);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
