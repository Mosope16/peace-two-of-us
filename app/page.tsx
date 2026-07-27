'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Sparkles, ArrowRight, ShieldCheck, Calendar, Mail, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useLDRStore } from '@/lib/store';

export default function LandingPage() {
  const router = useRouter();
  const { couple, pairWithCode } = useLDRStore();
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [pairError, setPairError] = useState('');
  const [pairSuccess, setPairSuccess] = useState(false);

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    const success = pairWithCode(inviteCodeInput);
    if (success) {
      setPairSuccess(true);
      setPairError('');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      setPairError('Invalid invite code. Try entering: LDR-892');
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Designed exclusively for 2 people in love</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Keep your hearts connected across any <span className="text-gradient">distance</span>.
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          A private, end-to-end digital sanctuary for two. Preserve cherished memories, exchange time-locked love letters, log daily moods, and count down to your next embrace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
          >
            <span>Enter Couple Space</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#pairing"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card text-zinc-200 hover:text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all hover:bg-white/5"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Pair Accounts with Code</span>
          </a>
        </div>
      </section>

      {/* Partner Invite Code Pairing Box */}
      <section id="pairing" className="max-w-xl mx-auto glass-card rounded-2xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Heart className="w-32 h-32 text-rose-500 fill-rose-500" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Connect Accounts into One Couple Profile</h2>
              <p className="text-xs text-zinc-400">Enter your partner's unique 6-character invitation code</p>
            </div>
          </div>

          <form onSubmit={handlePairSubmit} className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. LDR-892"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-700 focus:border-rose-500 text-white font-mono text-center tracking-widest text-lg focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition-all"
              >
                Connect
              </button>
            </div>

            {pairError && <p className="text-xs text-rose-400 font-medium">{pairError}</p>}
            {pairSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected successfully! Redirecting to dashboard...</span>
              </div>
            )}
          </form>

          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Current Demo Couple Code:</span>
            <span className="font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
              {couple.invite_code}
            </span>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Memories Album</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Store precious photos, descriptions, and milestones in a private shared gallery that never fades.
          </p>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Time-Locked Letters</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Write heartfelt letters sealed until special dates, like an upcoming anniversary, birthday, or reunion.
          </p>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Visit & Anniversary Tickers</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Watch the days, hours, and minutes count down together until your next airport embrace.
          </p>
        </div>
      </section>
    </div>
  );
}
