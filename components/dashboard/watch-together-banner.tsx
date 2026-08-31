'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tv, Play, ArrowRight, Sparkles } from 'lucide-react';
import { useActiveWatchSession } from '@/lib/queries/useWatchTogether';
import { useLDRStore } from '@/lib/store';
import { CreateRoomModal } from '@/components/watch/create-room-modal';

export function WatchTogetherBanner() {
  const { data: activeSession } = useActiveWatchSession();
  const { partner } = useLDRStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const partnerName = partner?.name.split(' ')[0] || 'Your partner';

  return (
    <>
      {activeSession ? (
        // ACTIVE SESSION BANNER (LIVELY / ATTENTION-GRABBING)
        <section className="soft-card rounded-3xl p-6 sm:p-8 border border-primary/40 bg-gradient-to-r from-primary/15 via-zinc-900/60 to-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-5 z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl flex-shrink-0 animate-pulse">
                <Tv className="w-8 h-8" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Room Live Now</span>
                </span>
                <span className="text-xs text-zinc-400">· {partnerName} is watching</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {activeSession.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click join to sync your player and watch together right now!
              </p>
            </div>
          </div>

          <Link
            href="/watch"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 z-10"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Join Watch Room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      ) : (
        // INACTIVE BANNER (CALL TO ACTION)
        <section className="soft-card soft-card-hover rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-border">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg flex-shrink-0">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <h3 className="text-lg font-bold text-white">Watch Together</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>YouTube Realtime</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Watch YouTube videos synchronously with {partnerName}. Play, pause, seek, and send live emoji reactions together.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-primary/50 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            <span>Start a Watch Room</span>
          </button>
        </section>
      )}

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Navigating to watch page when created
          window.location.href = '/watch';
        }}
      />
    </>
  );
}

