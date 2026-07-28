'use client';

import React from 'react';
import { Heart, Plus, Sparkles } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { calculateDaysTogether, triggerLoveConfetti } from '@/lib/utils';

export function HeroSection() {
  const { couple } = useLDRStore();

  if (!couple) return null;

  const daysTogether = calculateDaysTogether(couple.relationship_start_date);

  return (
    <section className="glass-card rounded-3xl p-6 sm:p-10 border border-rose-500/30 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-rose-500/20 to-pink-500/0 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Couple Avatars & Names */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="relative flex items-center">
            <img
              src={couple.partner_one.avatar}
              alt={couple.partner_one.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-rose-500/40 shadow-lg"
            />
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500 border-2 border-zinc-950 flex items-center justify-center -ml-4 z-10 shadow-md">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white animate-heartbeat" />
            </div>
            {couple.is_connected && couple.partner_two ? (
              <img
                src={couple.partner_two.avatar}
                alt={couple.partner_two.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-pink-500/40 shadow-lg -ml-4"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-900 border-2 border-dashed border-rose-500/50 flex flex-col items-center justify-center -ml-4 text-rose-400 font-bold shadow-lg">
                <Plus className="w-6 h-6" />
                <span className="text-[9px]">Invite</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {couple.partner_one.username || couple.partner_one.name.split(' ')[0]} 
                {couple.is_connected && couple.partner_two 
                  ? ` & ${couple.partner_two.username || couple.partner_two.name.split(' ')[0]}` 
                  : ' (Waiting for Partner)'}
              </h1>
              {couple.is_connected && (
                <button onClick={triggerLoveConfetti} title="Celebrate Love!" className="text-xl hover:scale-125 transition-transform">
                  🎉
                </button>
              )}
            </div>
            
            {couple.is_connected && couple.partner_two ? (
              <p className="text-xs sm:text-sm text-emerald-400 font-medium flex items-center space-x-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>💚 Connected &bull; Invite Code: <span className="font-mono font-bold text-white bg-rose-500/20 px-1.5 py-0.5 rounded" suppressHydrationWarning>{couple.invite_code}</span></span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-amber-300 font-medium flex items-center space-x-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>⏳ Waiting for Partner &bull; Share Code: <span className="font-mono font-bold text-white bg-amber-500/20 px-1.5 py-0.5 rounded" suppressHydrationWarning>{couple.invite_code}</span></span>
              </p>
            )}
          </div>
        </div>

        {/* Days Together Counter Widget */}
        <div className="bg-zinc-950/80 border border-rose-500/30 rounded-2xl p-5 text-center min-w-[200px] shadow-inner">
          <span className="text-xs uppercase tracking-wider text-rose-300/80 font-bold block mb-1">Together For</span>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-4xl sm:text-5xl font-black text-gradient">{daysTogether}</span>
            <span className="text-2xl text-rose-500 animate-pulse">❤️</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium block mt-1">Days of Love</span>
        </div>

      </div>
    </section>
  );
}
