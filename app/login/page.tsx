'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, User as UserIcon, Key, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, AtSign } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { signUpUser, signInUser, linkPartnerWithInviteCode } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticatedUser, pairWithCode } = useLDRStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim() || !password.trim()) throw new Error('Please fill in email and password');

        const { user, couple } = await signUpUser(name, email, password, username);
        
        // If partner invite code was provided during signup, attempt linking
        if (inviteCode.trim()) {
          await linkPartnerWithInviteCode(inviteCode, user.id);
          pairWithCode(inviteCode);
        }

        setAuthenticatedUser(user, null, couple);
        setSuccessMsg('Account created successfully! Redirecting to couple dashboard...');
        setTimeout(() => router.push('/dashboard'), 1200);

      } else {
        if (!email.trim() || !password.trim()) throw new Error('Please enter email and password');

        const { currentUser, partnerUser, couple } = await signInUser(email, password);
        setAuthenticatedUser(currentUser, partnerUser, couple);

        setSuccessMsg('Logged in successfully! Redirecting to couple dashboard...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-8 sm:p-10 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-rose-950/20">
        
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 text-white mb-2">
            <Heart className="w-8 h-8 fill-white animate-heartbeat" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back ❤️' : 'Join TwoOfUs LDR'}
          </h2>

          <p className="text-xs text-zinc-400">
            {mode === 'signin'
              ? 'Sign in to access your private couple space'
              : 'Create an account & connect with your partner in under 2 minutes'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              mode === 'signin' ? 'bg-rose-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              mode === 'signup' ? 'bg-rose-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Username / Nickname</span>
                  <span className="text-[10px] text-zinc-400">Optional</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. @sweetheart or sarah_j"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white text-xs focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                <span>Partner's Invite Code (Optional)</span>
                <span className="text-[10px] text-rose-400">e.g. LDR-892</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. LDR-892"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white font-mono uppercase text-xs focus:outline-none transition-colors tracking-widest"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">If your partner already signed up, enter their code to connect accounts!</p>
            </div>
          )}

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
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Space' : 'Create Couple Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 text-[11px] text-zinc-400">
          <span>Protected by Supabase Row Level Security &amp; End-to-End Privacy</span>
        </div>
      </div>
    </div>
  );
}
