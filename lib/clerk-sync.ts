import type { Couple, User } from '@/types';

export type ClerkSyncResult = {
  user: User;
  partner: User | null;
  couple: Couple;
};

export async function syncClerkUser(clientUserData?: Partial<User>): Promise<ClerkSyncResult> {
  const response = await fetch('/api/auth/sync-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: clientUserData ? JSON.stringify(clientUserData) : JSON.stringify({}),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || `Sync failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
