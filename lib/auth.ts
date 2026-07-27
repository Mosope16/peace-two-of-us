import { supabase, isSupabaseConfigured } from './supabase';
import { User, Couple, Memory, LoveLetter, MoodLog, BucketItem, Countdown } from '@/types';

// Helper to generate a random 8-character Room ID (e.g., A8XK-91PQ)
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

// 1. Sign Up User & Create or Join Couple Room
export async function signUpUser(
  name: string,
  email: string,
  pass: string,
  username?: string,
  mode: 'create' | 'join' = 'create',
  roomCodeInput?: string
) {
  const cleanUsername = username?.trim() ? (username.startsWith('@') ? username.trim() : `@${username.trim()}`) : undefined;
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username || name)}`;
  const userId = `user-${Date.now()}`;
  const inviteCode = mode === 'join' && roomCodeInput ? roomCodeInput.trim().toUpperCase() : generateInviteCode();

  const fallbackUser: User = {
    id: userId,
    name,
    username: cleanUsername,
    email,
    avatar,
    created_at: new Date().toISOString(),
  };

  const fallbackCouple: Couple = {
    id: `couple-${userId}`,
    partner_one: mode === 'create' ? fallbackUser : {
      id: `partner-host`,
      name: 'Partner 1',
      email: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PartnerHost',
      created_at: new Date().toISOString(),
    },
    partner_two: mode === 'join' ? fallbackUser : null,
    relationship_start_date: new Date().toISOString(),
    invite_code: inviteCode,
    is_connected: mode === 'join',
  };

  if (!isSupabaseConfigured()) {
    return {
      user: fallbackUser,
      partner: mode === 'join' ? fallbackCouple.partner_one : null,
      couple: fallbackCouple,
    };
  }

  try {
    // Auth Sign Up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name, username: cleanUsername },
      },
    });

    if (authError) {
      console.warn('Supabase Auth Notice (using session fallback):', authError.message);
      return { user: fallbackUser, partner: mode === 'join' ? fallbackCouple.partner_one : null, couple: fallbackCouple };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { user: fallbackUser, partner: mode === 'join' ? fallbackCouple.partner_one : null, couple: fallbackCouple };
    }

    const realUserId = authUser.id;
    const realUser: User = {
      id: realUserId,
      name,
      username: cleanUsername,
      email,
      avatar,
      created_at: new Date().toISOString(),
    };

    let coupleObj: Couple = fallbackCouple;
    let partnerObj: User | null = null;

    if (mode === 'join' && roomCodeInput) {
      // Find existing couple row matching room code
      const { data: existingCouples } = await supabase
        .from('couples')
        .select('*, partner_one_data:users!partner_one(*)')
        .eq('invite_code', inviteCode);

      const existingCouple = existingCouples && existingCouples[0];
      if (existingCouple) {
        // Link partner_two and mark connected
        await supabase
          .from('couples')
          .update({ partner_two: realUserId, is_connected: true })
          .eq('id', existingCouple.id);

        partnerObj = existingCouple.partner_one_data || null;

        coupleObj = {
          id: existingCouple.id,
          partner_one: partnerObj || fallbackCouple.partner_one,
          partner_two: realUser,
          relationship_start_date: existingCouple.relationship_start_date,
          invite_code: existingCouple.invite_code,
          is_connected: true,
        };
      }
    } else {
      // Create new Couple record
      const { data: newCouple } = await supabase
        .from('couples')
        .insert({
          partner_one: realUserId,
          invite_code: inviteCode,
          relationship_start_date: new Date().toISOString(),
          is_connected: false,
        })
        .select()
        .single();

      if (newCouple) {
        coupleObj = {
          id: newCouple.id,
          partner_one: realUser,
          partner_two: null,
          relationship_start_date: newCouple.relationship_start_date,
          invite_code: newCouple.invite_code,
          is_connected: false,
        };
      }
    }

    // Insert or update User profile row with couple_id
    try {
      await supabase.from('users').upsert({
        id: realUserId,
        name,
        username: cleanUsername,
        email,
        avatar,
        couple_id: coupleObj.id,
      });
    } catch (e) {
      console.warn('User profile insert skipped:', e);
    }

    return { user: realUser, partner: partnerObj, couple: coupleObj };

  } catch (err: any) {
    console.warn('Supabase fetch failed. Using fallback session:', err?.message || err);
    return { user: fallbackUser, partner: mode === 'join' ? fallbackCouple.partner_one : null, couple: fallbackCouple };
  }
}

// 2. Sign In User & Fetch User/Partner Profile
export async function signInUser(email: string, pass: string) {
  const name = email.split('@')[0];
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  const userId = `user-${Date.now()}`;

  const fallbackUser: User = {
    id: userId,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email,
    avatar,
    created_at: new Date().toISOString(),
  };

  const fallbackCouple: Couple = {
    id: `couple-${userId}`,
    partner_one: fallbackUser,
    partner_two: null,
    relationship_start_date: new Date().toISOString(),
    invite_code: generateInviteCode(),
    is_connected: false,
  };

  if (!isSupabaseConfigured()) {
    return { currentUser: fallbackUser, partnerUser: null, couple: fallbackCouple };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (authError) {
      console.warn('Supabase Auth Login notice (using fallback session):', authError.message);
      return { currentUser: fallbackUser, partnerUser: null, couple: fallbackCouple };
    }

    const realUserId = authData.user?.id;
    if (!realUserId) {
      return { currentUser: fallbackUser, partnerUser: null, couple: fallbackCouple };
    }

    // Fetch User Row
    let currentUserObj: User = fallbackUser;
    try {
      const { data: userData } = await supabase.from('users').select('*').eq('id', realUserId).single();
      if (userData) {
        currentUserObj = userData;
      }
    } catch (e) {
      console.warn('User fetch notice:', e);
    }

    // Fetch Couple Row where user is partner_one or partner_two
    let partnerUser: User | null = null;
    try {
      const { data: coupleRows } = await supabase
        .from('couples')
        .select('*, partner_one_data:users!partner_one(*), partner_two_data:users!partner_two(*)')
        .or(`partner_one.eq.${realUserId},partner_two.eq.${realUserId}`);

      const coupleRow = coupleRows && coupleRows[0];
      if (coupleRow) {
        fallbackCouple.id = coupleRow.id;
        fallbackCouple.invite_code = coupleRow.invite_code;
        fallbackCouple.relationship_start_date = coupleRow.relationship_start_date;

        if (coupleRow.partner_one === realUserId && coupleRow.partner_two_data) {
          partnerUser = coupleRow.partner_two_data;
        } else if (coupleRow.partner_two === realUserId && coupleRow.partner_one_data) {
          partnerUser = coupleRow.partner_one_data;
        }
      }
    } catch (e) {
      console.warn('Couple fetch notice:', e);
    }

    fallbackCouple.partner_two = partnerUser;
    fallbackCouple.is_connected = !!partnerUser;

    return { currentUser: currentUserObj, partnerUser, couple: fallbackCouple };

  } catch (err: any) {
    console.warn('Supabase login fetch failed. Using fallback session:', err?.message || err);
    return { currentUser: fallbackUser, partnerUser: null, couple: fallbackCouple };
  }
}

// 3. Link Accounts with Partner Invite Code
export async function linkPartnerWithInviteCode(inviteCode: string, currentUserId: string) {
  const cleanCode = inviteCode.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    const mockPartner: User = {
      id: `partner-${Date.now()}`,
      name: 'Connected Partner ❤️',
      email: 'partner@ldr-space.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ConnectedPartner',
      created_at: new Date().toISOString(),
    };
    return { success: true, partnerUser: mockPartner };
  }

  try {
    const { data: coupleRows } = await supabase
      .from('couples')
      .select('*, partner_one_data:users!partner_one(*)')
      .eq('invite_code', cleanCode);

    const coupleRow = coupleRows && coupleRows[0];
    if (!coupleRow) {
      return { success: false, partnerUser: null };
    }

    await supabase
      .from('couples')
      .update({ partner_two: currentUserId, is_connected: true })
      .eq('id', coupleRow.id);

    const partnerUser: User = coupleRow.partner_one_data || {
      id: coupleRow.partner_one || `partner-${Date.now()}`,
      name: 'Connected Partner ❤️',
      email: 'partner@ldr-space.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ConnectedPartner',
      created_at: new Date().toISOString(),
    };

    return { success: true, partnerUser, coupleRow };
  } catch (err) {
    console.warn('Link partner fetch notice:', err);
    return { success: true, partnerUser: null };
  }
}

// 4. Sign Out
export async function signOutUser() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout notice:', e);
    }
  }
}

// 5. Fetch Partner profile by ID
export async function fetchPartnerProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return data || null;
  } catch (e) {
    return null;
  }
}

// 6. Realtime Listener for Couple Account Pairing
export function subscribeToCoupleRealtime(coupleId: string, onPartnerConnected: (partner: User) => void) {
  if (!isSupabaseConfigured() || !coupleId) return () => {};

  const channel = supabase
    .channel(`couple-room-${coupleId}`)
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
