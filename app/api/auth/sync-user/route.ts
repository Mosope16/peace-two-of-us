import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { generateInviteCode, stableUuidFromClerkId } from '@/lib/server/auth-utils';
import type { Couple, User } from '@/types';

type UserRow = {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  avatar?: string | null;
  couple_id?: string | null;
  created_at: string;
};

type CoupleRow = {
  id: string;
  partner_one: string;
  partner_two: string | null;
  relationship_start_date: string;
  invite_code: string;
};

function syncError(message: string, error: any) {
  console.error(`[auth/sync-user] ${message}`, error);
  const detail = error?.message || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  return NextResponse.json({ error: `${message} (${detail})` }, { status: 500 });
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username || undefined,
    email: row.email,
    avatar: row.avatar || '',
    couple_id: row.couple_id || undefined,
    created_at: row.created_at,
  };
}

function fallbackCouple(appUser: User): Couple {
  return {
    id: `couple-${appUser.id}`,
    partner_one: appUser,
    partner_two: null,
    relationship_start_date: new Date().toISOString(),
    invite_code: generateInviteCode(),
    is_connected: false,
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    let clerkUser: any = null;
    try {
      clerkUser = await currentUser();
    } catch (clerkErr) {
      console.warn('[auth/sync-user] Clerk currentUser() fetch failed, falling back to session claims & client payload:', clerkErr);
    }

    const primaryEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      body.email ||
      `user-${userId}@peace.app`;

    const name =
      clerkUser?.fullName ||
      clerkUser?.firstName ||
      body.name ||
      primaryEmail.split('@')[0];

    const googleAccount = clerkUser?.externalAccounts?.find((a: any) => a.provider === 'oauth_google' || a.provider === 'google');
    const googleAvatar = googleAccount?.imageUrl || googleAccount?.avatarUrl;
    const avatar = googleAvatar || clerkUser?.imageUrl || body.avatar || '';
    const username = clerkUser?.username || body.username || undefined;

    let appUser: User = {
      id: stableUuidFromClerkId(userId),
      name,
      username,
      email: primaryEmail,
      avatar,
      created_at: clerkUser?.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
    };

    const supabase = createSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json({
        user: appUser,
        partner: null,
        couple: fallbackCouple(appUser),
      });
    }

    // 1. Fetch existing user by UUID or email
    const { data: existingUsers, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${appUser.id},email.eq.${primaryEmail}`)
      .limit(1);

    if (existingUserError) {
      return syncError('Could not load existing user profile.', existingUserError);
    }

    const existingUser = (existingUsers?.[0] || null) as UserRow | null;

    if (existingUser) {
      appUser = {
        ...appUser,
        id: existingUser.id,
        couple_id: existingUser.couple_id || undefined,
        created_at: existingUser.created_at,
      };
    }

    // 2. Upsert user profile
    const { error: upsertUserError } = await supabase.from('users').upsert({
      id: appUser.id,
      name: appUser.name,
      username: appUser.username || null,
      email: appUser.email,
      avatar: appUser.avatar,
    });

    if (upsertUserError) {
      return syncError('Could not save user profile.', upsertUserError);
    }

    // 3. Fetch Couple
    const { data: existingCouples, error: coupleFetchError } = await supabase
      .from('couples')
      .select('*')
      .or(`partner_one.eq.${appUser.id},partner_two.eq.${appUser.id}`)
      .limit(1);

    if (coupleFetchError) {
      return syncError('Could not load couple profile.', coupleFetchError);
    }

    const coupleRow = (existingCouples?.[0] || null) as CoupleRow | null;

    if (coupleRow && coupleRow.id !== appUser.couple_id) {
      const { error: linkUserError } = await supabase
        .from('users')
        .update({ couple_id: coupleRow.id })
        .eq('id', appUser.id);

      if (linkUserError) {
        console.warn('User couple linking notice:', linkUserError.message);
      }
      appUser.couple_id = coupleRow.id;
    }

    const currentUserWithCouple = { ...appUser, couple_id: coupleRow?.id };

    if (!coupleRow) {
      return NextResponse.json({
        user: currentUserWithCouple,
        partner: null,
        couple: null,
      });
    }

    // 4. Fetch Partner user profile separately
    let partner: User | null = null;
    const partnerId = coupleRow.partner_one === appUser.id ? coupleRow.partner_two : coupleRow.partner_one;

    if (partnerId) {
      const { data: partnerRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();

      if (partnerRow) {
        partner = toUser(partnerRow as UserRow);
      }
    }

    const couple: Couple = {
      id: coupleRow.id,
      partner_one:
        coupleRow.partner_one === appUser.id
          ? currentUserWithCouple
          : partner || {
              id: coupleRow.partner_one,
              name: 'Partner',
              email: '',
              avatar: '',
              created_at: new Date().toISOString(),
            },
      partner_two: coupleRow.partner_two
        ? coupleRow.partner_two === appUser.id
          ? currentUserWithCouple
          : partner
        : null,
      relationship_start_date: coupleRow.relationship_start_date,
      invite_code: coupleRow.invite_code,
      is_connected: !!coupleRow.partner_two,
    };

    return NextResponse.json({
      user: currentUserWithCouple,
      partner,
      couple,
    });
  } catch (err: any) {
    return syncError('Unexpected error during user sync.', err);
  }
}
