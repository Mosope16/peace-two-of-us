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
    <section className="soft-card p-6 sm:p-8 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6 md:gap-12">
        
        {/* Greeting & Name */}
        <div className="space-y-4 w-full md:w-auto">
          <p className="text-xs sm:text-sm font-medium text-zinc-400 tracking-wide uppercase">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
          </p>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="relative flex-shrink-0">
              <img
                src={couple.partner_one.avatar}
                alt={couple.partner_one.name}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover ring-2 ring-primary/20 shadow-lg"
              />
              {couple.partner_two && (
                <img
                  src={couple.partner_two.avatar}
                  alt={couple.partner_two.name}
                  className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-background shadow-lg"
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight truncate">
                {couple.partner_one.username || couple.partner_one.name.split(' ')[0]} 
              </h1>
              {couple.partner_two && (
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 sm:mt-2 flex items-center gap-1.5 truncate">
                  <Heart className="w-3.5 h-3.5 text-primary fill-primary animate-heartbeat flex-shrink-0" />
                  <span className="truncate">&amp; {couple.partner_two.username || couple.partner_two.name.split(' ')[0]}</span>
                </p>
              )}
              {(!couple.partner_two && !couple.is_connected) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Share Code:</span>
                  <span className="font-mono font-bold text-white bg-surface px-2 py-0.5 sm:py-1 border border-border rounded text-xs sm:text-sm" suppressHydrationWarning>{couple.invite_code}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Days Together Stats */}
        {daysTogether > 0 && (
          <div className="flex flex-col items-start md:items-end space-y-0.5 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800 w-full md:w-auto">
            <span className="text-xs sm:text-sm font-medium text-zinc-400 tracking-wide uppercase block">Together</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black text-primary tracking-tighter">{daysTogether}</span>
              <span className="text-sm sm:text-lg text-zinc-500 font-medium">Days</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
