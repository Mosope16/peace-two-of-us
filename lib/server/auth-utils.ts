import { createHash } from 'node:crypto';

export function stableUuidFromClerkId(clerkUserId: string) {
  const hash = createHash('sha256').update(`clerk:${clerkUserId}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for node environments without global crypto
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  
  let result = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += '-';
    result += chars[array[i] % chars.length];
  }
  return result;
}
