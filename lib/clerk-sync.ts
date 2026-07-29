import type { Couple, User } from '@/types';

export type ClerkSyncResult = {
  user: User;
  partner: User | null;
  couple: Couple;
};

export async function syncClerkUser(): Promise<ClerkSyncResult> {
  const response = await fetch('/api/auth/sync-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Could not sync your account.');
  }

  return response.json();
}
