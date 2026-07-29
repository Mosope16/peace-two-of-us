'use client';

import React from 'react';
import Link from 'next/link';
import { Plane, Gift, ChevronRight, Loader2 } from 'lucide-react';
import { useCountdowns } from '@/lib/queries/useCountdowns';
import { calculateCountdownDays } from '@/lib/utils';

export function CountdownsSection() {
  const { data: countdowns = [], isLoading } = useCountdowns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 h-full">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  // Find Next Visit countdown and Next Anniversary countdown
  const nextVisitCountdown = countdowns.find((c) => c.category === 'visit') || countdowns[0];
  const nextAnniversaryCountdown = countdowns.find((c) => c.category === 'anniversary') || countdowns[1];

  const visitDays = nextVisitCountdown ? calculateCountdownDays(nextVisitCountdown.target_date) : null;
  const annivDays = nextAnniversaryCountdown ? calculateCountdownDays(nextAnniversaryCountdown.target_date) : null;

  return (
    <>
      {/* Next Visit Countdown Card */}
      {nextVisitCountdown && visitDays && (
        <div className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plane className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">{nextVisitCountdown.title}</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {visitDays.days} Days Left
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-zinc-950/50 rounded-xl border border-zinc-800">
            <div>
              <span className="text-2xl font-bold text-white">{visitDays.days}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Days</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{visitDays.hours}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Hours</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{visitDays.minutes}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Mins</span>
            </div>
          </div>

          <Link href="/countdowns" className="text-xs font-semibold text-rose-300 hover:text-rose-200 flex items-center space-x-1">
            <span>View all countdowns</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Next Anniversary Countdown Card */}
      {nextAnniversaryCountdown && annivDays && (
        <div className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-border flex items-center justify-center text-rose-400">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">{nextAnniversaryCountdown.title}</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-border">
              {annivDays.days} Days Left
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-zinc-950/50 rounded-xl border border-zinc-800">
            <div>
              <span className="text-2xl font-bold text-white">{annivDays.days}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Days</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{annivDays.hours}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Hours</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{annivDays.minutes}</span>
              <span className="text-[10px] text-zinc-400 block uppercase">Mins</span>
            </div>
          </div>

          <Link href="/countdowns" className="text-xs font-semibold text-rose-300 hover:text-rose-200 flex items-center space-x-1">
            <span>View anniversary dates</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );
}
