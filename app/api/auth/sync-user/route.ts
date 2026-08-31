import { createHash } from 'node:crypto';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { generateInviteCode } from '@/lib/server/auth-utils';
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
  partner_one_data?: UserRow | null;
  partner_two_data?: UserRow | null;
};

function syncError(message: string, error: any) {
  console.error(`[auth/sync-user] ${message}`, error);
  const detail = error?.message || error?.details || message;
  return NextResponse.json({ error: `${message} (${detail})` }, { status: 500 });
}

import { stableUuidFromClerkId } from '@/lib/server/auth-utils';

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

export async function POST() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;

  if (!primaryEmail) {
    return NextResponse.json({ error: 'Your Google account does not have a primary email address.' }, { status: 400 });
  }

  let appUser: User = {
    id: stableUuidFromClerkId(clerkUser.id),
    name: clerkUser.fullName || clerkUser.firstName || primaryEmail.split('@')[0],
    username: clerkUser.username || undefined,
    email: primaryEmail,
    avatar: clerkUser.imageUrl || '',
    created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
  };

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      user: appUser,
      partner: null,
      couple: fallbackCouple(appUser),
    });
  }

  const { data: existingUsers, error: existingUserError } = await supabase
    .from('users')
    .select('*')
    .or(`id.eq.${appUser.id},email.eq.${primaryEmail}`);

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

  const { error: upsertUserError } = await supabase.from('users').upsert({
    id: appUser.id,
    name: appUser.name,
    username: appUser.username,
    email: appUser.email,
    avatar: appUser.avatar,
  });

  if (upsertUserError) {
    return syncError('Could not save user profile.', upsertUserError);
  }

  const { data: existingCouples, error: coupleFetchError } = await supabase
    .from('couples')
    .select('*, partner_one_data:users!partner_one(*), partner_two_data:users!partner_two(*)')
    .or(`partner_one.eq.${appUser.id},partner_two.eq.${appUser.id}`);

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
      return syncError('Could not link user profile to couple.', linkUserError);
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

  const partnerRow = coupleRow.partner_one === appUser.id ? coupleRow.partner_two_data : coupleRow.partner_one_data;
  const partner = partnerRow ? toUser(partnerRow) : null;

  const couple: Couple = {
    id: coupleRow.id,
    partner_one: coupleRow.partner_one === appUser.id ? currentUserWithCouple : toUser(coupleRow.partner_one_data || {
      ...currentUserWithCouple,
      id: coupleRow.partner_one,
    }),
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
}
