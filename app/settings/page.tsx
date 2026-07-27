'use client';

import React, { useState } from 'react';
import { Settings, Heart, Copy, Check, Calendar, ShieldCheck, Database, Sparkles, User, RefreshCw } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SettingsPage() {
  const { couple, currentUser, partner, updateCoupleStartDate } = useLDRStore();
  const [copied, setCopied] = useState(false);
  const [startDate, setStartDate] = useState(
    couple.relationship_start_date ? couple.relationship_start_date.split('T')[0] : ''
  );
  const [savedMessage, setSavedMessage] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couple.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveStartDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    updateCoupleStartDate(new Date(startDate).toISOString());
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Settings className="w-8 h-8 text-rose-400" />
          <span>Couple Profile &amp; Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Manage your relationship start date, partner invitation code, and cloud integration.
        </p>
      </div>

      {/* 1. Couple Invitation Code Box */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 space-y-4 relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Your Partner Invite Code</h2>
            <p className="text-xs text-zinc-400">Share this code with your partner to pair accounts into one couple profile.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
          <div className="px-6 py-3 rounded-xl bg-zinc-950 border border-rose-500/30 font-mono text-2xl font-black text-rose-300 tracking-widest">
            {couple.invite_code}
          </div>
          <button
            onClick={handleCopyCode}
            className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {couple.is_connected && couple.partner_two ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Connected with {couple.partner_two.name} ❤️</span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Waiting for partner to join...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Relationship Start Date Editor */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/20 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Relationship Start Date</h2>
            <p className="text-xs text-zinc-400">Determines your &ldquo;Days Together&rdquo; counter on the couple dashboard.</p>
          </div>
        </div>

        <form onSubmit={handleSaveStartDate} className="space-y-4 max-w-md pt-2">
          <div className="flex items-center gap-3">
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
            >
              Update Date
            </button>
          </div>

          {savedMessage && (
            <p className="text-xs font-semibold text-emerald-400">✓ Relationship start date updated!</p>
          )}
        </form>
      </div>

      {/* 3. Connected Partners */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <User className="w-5 h-5 text-purple-400" />
          <span>Connected Couple Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center space-x-4">
            <img src={currentUser.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/50" />
            <div>
              <p className="font-bold text-white text-sm">{currentUser.name} (You)</p>
              <p className="text-xs text-zinc-400">{currentUser.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center space-x-4">
            <img src={partner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'} className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/50" />
            <div>
              <p className="font-bold text-white text-sm">{partner?.name || 'Partner'}</p>
              <p className="text-xs text-zinc-400">{partner?.email || 'Connected'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Backend Database Status (Supabase) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/20 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Database &amp; Storage Architecture</h2>
            <p className="text-xs text-zinc-400">Client-Side Persistent Store + Supabase PostgreSQL Ready</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
          <div className="flex items-center justify-between">
            <span>Instant Demo Mode:</span>
            <span className="font-semibold text-emerald-400">Active (Zustand + LocalStorage)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Supabase Cloud Integration:</span>
            <span className={`font-semibold ${isSupabaseConfigured() ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSupabaseConfigured() ? 'Configured' : 'Ready (schema.sql generated)'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
            To connect a live Supabase project, populate <code className="text-rose-300">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-rose-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="text-rose-300">.env.local</code>.
          </p>
        </div>
      </div>

    </div>
  );
}
