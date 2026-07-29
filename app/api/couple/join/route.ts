import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

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

  // Generate stable UUID
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(`clerk:${clerkUser.id}`).digest('hex');
  const userId = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');

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
