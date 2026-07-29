'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joinMode, setJoinMode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const createCoupleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/couple/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create couple space');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate everything to refresh layout/auth guard
      router.replace('/dashboard');
    },
    onError: (error: Error) => setErrorMsg(error.message)
  });

  const joinCoupleMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join couple space');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all dependencies
      router.replace('/dashboard');
    },
    onError: (error: Error) => setErrorMsg(error.message)
  });

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setErrorMsg('');
    joinCoupleMutation.mutate(inviteCode);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 4) {
      val = val.slice(0, 4) + '-' + val.slice(4, 8);
    }
    setInviteCode(val);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-border">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to Peace</h1>
          <p className="text-zinc-400">Create your private space together.</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {!joinMode ? (
          <div className="space-y-4 pt-4">
            <button
              onClick={() => {
                setErrorMsg('');
                createCoupleMutation.mutate();
              }}
              disabled={createCoupleMutation.isPending}
              className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-semibold rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {createCoupleMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create a Couple Space'
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <button
              onClick={() => {
                setErrorMsg('');
                setJoinMode(true);
              }}
              className="w-full h-14 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold rounded-2xl flex items-center justify-center transition-colors"
            >
              Join with Invite Code
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-4 text-left">
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Enter your partner's code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  maxLength={9}
                  placeholder="e.g. A8XK-91PQ"
                  className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors uppercase tracking-widest text-center text-lg font-mono"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!inviteCode.trim() || joinCoupleMutation.isPending}
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:hover:bg-rose-500"
              >
                {joinCoupleMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Join Space</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setJoinMode(false);
                  setErrorMsg('');
                }}
                className="w-full h-10 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
              >
                Back to options
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
