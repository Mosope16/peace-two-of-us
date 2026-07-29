'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { subscribeToCoupleRealtime } from '@/lib/supabase';
import { triggerLoveConfetti } from '@/lib/utils';
import { HeroSection } from '@/components/dashboard/hero-section';
import { CountdownsSection } from '@/components/dashboard/countdowns-section';
import { MoodSection } from '@/components/dashboard/mood-section';
import { MemoriesLettersSection } from '@/components/dashboard/memories-letters-section';

export default function DashboardPage() {
  const { couple, partner, updatePartnerProfile } = useLDRStore();

  useEffect(() => {
    if (couple && couple.id) {
      const unsubscribe = subscribeToCoupleRealtime(couple.id, (partnerUser) => {
        updatePartnerProfile(partnerUser);
        triggerLoveConfetti();
      });
      return () => unsubscribe();
    }
  }, [couple?.id, updatePartnerProfile]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO COUPLE BANNER & DAYS TOGETHER COUNTER */}
      <HeroSection />

      {/* 2. CORE DASHBOARD GRID: COUNTDOWNS + PARTNER MOOD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CountdownsSection />
        <MoodSection />
      </div>

      {/* 3. RECENT MEMORY & LOVE LETTER HIGHLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MemoriesLettersSection />
      </div>

      {/* 4. COUPLE GAMES HUB HIGHLIGHT BANNER */}
      <section className="glass-card glass-card-hover rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-zinc-900 to-rose-950/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Couple Games &amp; IQ Duels</h3>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                17 Quiz Categories
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 max-w-xl">
              Play Know Me Quiz (Long Distance, 18+ Spicy, Pop Culture), challenge {partner?.name.split(' ')[0] || 'Partner'} to a timed IQ Duel with private lock-ins, or solve Riddle Night puzzles together!
            </p>
          </div>
        </div>

        <Link
          href="/games"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-105 flex-shrink-0"
        >
          <span>Open Games Hub</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </div>
  );
}
