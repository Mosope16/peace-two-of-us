'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useLDRStore } from '@/lib/store';
import { Loader2, Lock } from 'lucide-react';
import { syncClerkUser } from '@/lib/clerk-sync';

const PUBLIC_ROUTES = ['/login', '/', '/sso-callback'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { isAuthenticated, setAuthenticatedUser, logoutUser } = useLDRStore();
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (isSignedIn && user) {
      let isCancelled = false;

      syncClerkUser()
        .then(({ user: appUser, partner, couple }) => {
          if (isCancelled) return;
          setSyncError('');
          setAuthenticatedUser(appUser, partner, couple);
        })
        .catch((err: Error) => {
          if (!isCancelled) {
            setSyncError(err.message);
          }
        });

      return () => {
        isCancelled = true;
      };
    }

    if (!isPublic) {
      logoutUser();
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, pathname, router, setAuthenticatedUser, logoutUser, user]);

  if (!isLoaded) {
    return null;
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (isSignedIn && !isAuthenticated && !isPublic) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
        <p className="text-xs text-zinc-400">{syncError || 'Preparing your private space...'}</p>
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-white">Private Space Locked 🔒</h2>
        <p className="text-xs text-zinc-400 max-w-sm">
          Please sign in or create an account to access your private couple space.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
