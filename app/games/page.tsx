'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Brain, HelpCircle, Sparkles, ArrowRight, ShieldAlert, Award, Lock, Zap, Users, ShieldCheck, CheckCircle2, Copy, Radio } from 'lucide-react';
import { useLDRStore } from '@/lib/store';

export default function GamesHubPage() {
  const { currentUser, partner, couple, activeGameRoom, createGameRoom, joinGameRoom, leaveGameRoom } = useLDRStore();
  const [roomInput, setRoomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const defaultRoomCode = `ROOM-${couple.invite_code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(defaultRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    const success = joinGameRoom(roomInput);
    if (success) {
      setJoinMsg('✅ Connected to live couple room successfully!');
      setRoomInput('');
    } else {
      setJoinMsg('❌ Invalid room code. Enter your couple code: ' + couple.invite_code);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-rose-500/30 relative overflow-hidden bg-gradient-to-br from-rose-950/40 via-zinc-900/90 to-purple-950/40 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Gamepad2 className="w-64 h-64 text-rose-500" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Couple Games &amp; Duels</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Play, Compete &amp; Discover More About <span className="text-gradient">Each Other</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Fun, competitive, and intimate mini-games designed specifically for long-distance couples. Test how well you know {partner?.name.split(' ')[0]}, duel in timed intelligence tests, and solve riddles together.
          </p>
        </div>
      </div>

      {/* LIVE COUPLE MULTIPLAYER ROOM CARD */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 border border-rose-500/30 space-y-6 relative overflow-hidden bg-gradient-to-r from-zinc-900 via-rose-950/20 to-zinc-900 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Radio className="w-5 h-5 animate-pulse text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Live Multiplayer Couple Room</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-time Sync Active</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Both devices connect via your shared couple code (<span className="font-mono text-rose-300 font-bold">{couple.invite_code}</span>). Answers sync instantly!
              </p>
            </div>
          </div>

          {/* Room Code Badge & Copy */}
          <div className="flex items-center space-x-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Room Code:</span>
            <span className="font-mono font-bold text-xs text-rose-300 bg-rose-500/20 px-2 py-1 rounded border border-rose-500/30">
              {defaultRoomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Copy Room Code"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Room Status & Join Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Active Partner Connection State */}
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Room Connection Status</h3>
            
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center space-x-2">
                <img src={currentUser.avatar} className="w-7 h-7 rounded-full object-cover ring-2 ring-rose-500" />
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Connected</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center space-x-2">
                <img src={partner?.avatar} className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-500" />
                <span className="font-bold text-white">{partner?.name}</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Linked</span>
              </span>
            </div>
          </div>

          {/* Enter Room Code Input */}
          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-zinc-300">
              Join Partner's Active Room:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`e.g. ${defaultRoomCode}`}
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-white text-xs font-mono tracking-wider focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex-shrink-0"
              >
                Join Room
              </button>
            </div>
            {joinMsg && <p className="text-xs font-medium text-rose-300">{joinMsg}</p>}
          </form>

        </div>
      </section>

      {/* Main Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. How Well Do You Know Me? */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group bg-gradient-to-b from-rose-950/20 to-zinc-900">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white font-bold">
              <Gamepad2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">How Well Do You Know Me?</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                One partner answers privately, the other guesses! Switch roles and compare scores at the end.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">Turn-Based</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">17 Categories</span>
            </div>
          </div>

          <Link
            href="/games/know-me"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play Know Me</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. This or That */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-amber-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group bg-gradient-to-b from-amber-950/20 to-zinc-900">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white font-bold">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">This or That</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Both choose independently between two options. Reveal together for instant 🎉 Match bonuses!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Match Answers</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">Quick Rounds</span>
            </div>
          </div>

          <Link
            href="/games/this-or-that"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play This or That</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3. Would You Rather */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group bg-gradient-to-b from-purple-950/20 to-zinc-900">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">Would You Rather</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Choose between wild &amp; romantic relationship scenarios. Compare choices together!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Scenarios</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">Fun Topics</span>
            </div>
          </div>

          <Link
            href="/games/would-you-rather"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play Would You Rather</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4. Compatibility Quiz */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-pink-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group bg-gradient-to-b from-pink-950/20 to-zinc-900">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white font-bold">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">Compatibility Quiz</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Answer relationship &amp; lifestyle questions to uncover your overall couple compatibility percentage!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">% Score Breakdown</span>
            </div>
          </div>

          <Link
            href="/games/compatibility"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Take Compatibility Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 5. IQ Duel */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-indigo-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold">
              <Brain className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">IQ Duel</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Competitive intelligence battle! Per-question clocks and double points on the final round.
              </p>
            </div>
          </div>

          <Link
            href="/games/iq-duel"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play IQ Duel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 6. Riddle Night */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-emerald-500/30 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Riddle Night</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Solve love &amp; LDR riddles together to earn achievement badges.
              </p>
            </div>
          </div>

          <Link
            href="/games/riddle-night"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play Riddle Night</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Expandable / More to Come Section */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800 text-center space-y-3 bg-zinc-900/40">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>More to come sha! 🚀</span>
        </div>
        <h3 className="text-lg font-bold text-white">Upcoming Game Modes</h3>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          We are constantly crafting new ways for long distance lovers to stay connected, including Truth or Dare, Couples Bingo, and Memory Match.
        </p>
      </div>
    </div>
  );
}
