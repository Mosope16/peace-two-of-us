'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { HeroSection } from '@/components/dashboard/hero-section';
import { CountdownsSection } from '@/components/dashboard/countdowns-section';
import { MoodSection } from '@/components/dashboard/mood-section';
import { MemoriesLettersSection } from '@/components/dashboard/memories-letters-section';
import { WatchTogetherBanner } from '@/components/dashboard/watch-together-banner';

export default function DashboardPage() {
  const { partner } = useLDRStore();
  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO COUPLE BANNER & DAYS TOGETHER COUNTER */}
      <HeroSection />

      {/* 2. WATCH TOGETHER LIVE BANNER */}
      <WatchTogetherBanner />

      {/* 3. CORE DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MoodSection />
        <CountdownsSection />
      </div>

      {/* 4. LOVE LETTERS & BUCKET LIST HIGHLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MemoriesLettersSection />
      </div>

      {/* 5. COUPLE GAMES HUB HIGHLIGHT BANNER */}
      <section className="soft-card soft-card-hover rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-white">Couple Games &amp; IQ Duels</h3>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                17 Quiz Categories
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Play Know Me Quiz, challenge {partner?.name.split(' ')[0] || 'your partner'} to a timed IQ Duel, or solve Riddle Night puzzles together!
            </p>
          </div>
        </div>

        <Link
          href="/games"
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95 flex-shrink-0"
        >
          <span>Open Games Hub</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

    </div>
  );
}
