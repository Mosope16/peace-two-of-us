'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useLDRStore } from '@/lib/store';
import { syncClerkUser } from '@/lib/clerk-sync';
import type { User } from '@/types';

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
            console.error('Auth sync error:', err.message);
            if (!isAuthenticated && user) {
              const fallbackAppUser: User = {
                id: user.id,
                name: user.fullName || user.firstName || 'User',
                email: user.primaryEmailAddress?.emailAddress || '',
                avatar: user.imageUrl || '',
                created_at: new Date().toISOString(),
              };
              setAuthenticatedUser(fallbackAppUser, null, {
                id: `couple-${user.id}`,
                partner_one: fallbackAppUser,
                partner_two: null,
                relationship_start_date: new Date().toISOString(),
                invite_code: 'LDR-PEACE',
                is_connected: false,
              });
            }
          }
        });

      return () => {
        isCancelled = true;
      };
    }

    if (!isPublic && !isSignedIn && isLoaded) {
      logoutUser();
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, pathname, router, setAuthenticatedUser, logoutUser, user]);

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

  // We no longer block rendering of children while syncing.
  // The middleware already protects routes, and Zustand persist hydrates UI immediately.
  // This drastically improves FCP (First Contentful Paint) and TTI (Time to Interactive).

  return <>{children}</>;
}
