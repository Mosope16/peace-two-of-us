'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, CheckCircle2, ShieldCheck, Loader2, LogIn } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { useSignIn, useUser } from '@clerk/nextjs';
import { syncClerkUser } from '@/lib/clerk-sync';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticatedUser } = useLDRStore();
  const { signIn } = useSignIn();
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userLoaded || !isSignedIn || !user) return;

    let isCancelled = false;

    syncClerkUser()
      .then(({ user: appUser, partner, couple }) => {
        if (isCancelled) return;
        setAuthenticatedUser(appUser, partner, couple);
        setSuccessMsg('Welcome back! Redirecting to your dashboard...');
        window.setTimeout(() => router.replace('/dashboard'), 300);
      })
      .catch((err: Error) => {
        if (!isCancelled) {
          setErrorMsg(err.message);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, userLoaded, user, router, setAuthenticatedUser]);

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!signIn) {
      setErrorMsg('Authentication is still loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });

      if (result.error) {
        throw result.error;
      }
    } catch (err: unknown) {
      console.error('Clerk auth error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in could not be started.');
      setIsLoading(false);
    }
  };

  if (!userLoaded) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500/50" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
          <CheckCircle2 className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white">Welcome back!</h2>
        <p className="text-xs text-zinc-400">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-8 sm:p-10 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-rose-950/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 text-white mb-2">
            <Heart className="w-8 h-8 fill-white animate-heartbeat" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back ❤️</h2>
          <p className="text-xs text-zinc-400">
            Sign in with Google to access your private couple space.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-2 text-center space-y-2">
          <div className="flex items-center justify-center text-[10px] text-zinc-500 space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Secure Google sign-in • Private couple dashboard</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Your first sign-in creates your private room automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
