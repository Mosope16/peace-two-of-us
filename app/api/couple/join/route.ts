import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { stableUuidFromClerkId } from '@/lib/server/auth-utils';

export async function POST(req: Request) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let inviteCode = '';
  try {
    const body = await req.json();
    inviteCode = body.inviteCode;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!inviteCode || typeof inviteCode !== 'string') {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const userId = stableUuidFromClerkId(clerkUser.id);

  // Call the transactional RPC
  const { data, error } = await supabase.rpc('join_couple', {
    p_invite_code: inviteCode,
    p_user_id: userId
  });

  if (error) {
    console.error('RPC Error:', error);
    return NextResponse.json({ error: 'Failed to join couple.' }, { status: 500 });
  }

  if (data && !data.success) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, couple_id: data.couple_id });
}
