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
  const { isAuthenticated, currentUser, setAuthenticatedUser, logoutUser } = useLDRStore();
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
  const isOnboarding = pathname === '/onboarding';

  // Force onboarding if logged in but no couple
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (!currentUser.couple_id && !isOnboarding) {
        router.replace('/onboarding');
      } else if (currentUser.couple_id && isOnboarding) {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, currentUser, isOnboarding, router]);

  if (isSignedIn && !isAuthenticated && !isPublic) {
    if (syncError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            {syncError}
          </p>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => {
                setSyncError('');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                logoutUser();
                router.replace('/login');
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
        <p className="text-xs text-zinc-400">Preparing your private space...</p>
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
