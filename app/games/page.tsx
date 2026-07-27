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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Know Me Quiz Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white font-bold">
              <Gamepad2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">Know Me Quiz</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  17 Categories
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Test how deeply you understand each other across 17 categories including Long Distance, Pop Culture, Spicy 18+, Deep, and Hot Takes.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">✈️ LDR</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">🔥 18+ Spicy</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">👉 Most Likely</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">+14 more</span>
            </div>
          </div>

          <Link
            href="/games/know-me"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Play Know Me Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. IQ Duel Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-bold">
              <Brain className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">IQ Duel</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Timed Battle
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Competitive intelligence challenge! Lock in answers privately with per-question countdown clocks. Reveals happen at the end with double points on the final question!
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-[11px] text-zinc-300">
              <div className="flex items-center space-x-2 text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>🔒 Private lock-in — answer secretly</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⏱️ Per-question timers &amp; 👑 2x final Q</span>
              </div>
            </div>
          </div>

          <Link
            href="/games/iq-duel"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Enter IQ Duel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3. Riddle Night Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-emerald-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Riddle Night</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Co-op &amp; Race
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Mind-bending romantic riddles and logic puzzles to crack together over video calls or race to solve first!
              </p>
            </div>

            <div className="pt-2 text-[11px] text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              💡 Interactive hint unlocks &amp; instant answer checkers.
            </div>
          </div>

          <Link
            href="/games/riddle-night"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>Solve Riddles</span>
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
