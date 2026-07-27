'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLDRStore } from '@/lib/store';
import { Heart, Lock, Sparkles } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useLDRStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      if (!isAuthenticated && !isPublic) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, pathname, isMounted, router]);

  if (!isMounted) {
    return null;
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);

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
