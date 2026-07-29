import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { generateInviteCode } from '@/lib/auth';
import { stableUuidFromClerkId } from '../sync-user/route'; // We'll extract this or duplicate for now

export async function POST() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // We need the stable UUID we use in sync-user
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(`clerk:${clerkUser.id}`).digest('hex');
  const userId = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');

  // Check if they already have a couple
  const { data: userRow } = await supabase.from('users').select('couple_id').eq('id', userId).single();
  
  if (userRow?.couple_id) {
    return NextResponse.json({ error: 'You are already in a couple space' }, { status: 400 });
  }

  // 1. Create a new couple
  const inviteCode = generateInviteCode();
  const { data: newCouple, error: createError } = await supabase
    .from('couples')
    .insert({
      partner_one: userId,
      invite_code: inviteCode,
      relationship_start_date: new Date().toISOString(),
      status: 'waiting'
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // 2. Link user to new couple
  const { error: linkError } = await supabase
    .from('users')
    .update({ couple_id: newCouple.id })
    .eq('id', userId);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, couple_id: newCouple.id });
}
