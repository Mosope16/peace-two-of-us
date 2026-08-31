'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tv,
  ArrowLeft,
  PowerOff,
  Sparkles,
  Plus,
  Play,
  Film,
  Compass,
} from 'lucide-react';
import { useActiveWatchSession, useEndWatchSession } from '@/lib/queries/useWatchTogether';
import { useLDRStore } from '@/lib/store';
import { YouTubePlayer } from '@/components/watch/youtube-player';
import { WatchChat } from '@/components/watch/watch-chat';
import { FloatingReactions } from '@/components/watch/floating-reactions';
import { CreateRoomModal } from '@/components/watch/create-room-modal';

export default function WatchTogetherPage() {
  const { data: activeSession, isLoading } = useActiveWatchSession();
  const endSessionMutation = useEndWatchSession();
  const { currentUser, partner } = useLDRStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFloatingReaction, setActiveFloatingReaction] = useState<string | null>(null);

  const handleTriggerReaction = (reaction: string) => {
    setActiveFloatingReaction(reaction);
    // Reset after trigger so next identical reaction fires cleanly
    setTimeout(() => setActiveFloatingReaction(null), 300);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (confirm('Are you sure you want to end this Watch Together session for both of you?')) {
      await endSessionMutation.mutateAsync(activeSession.id);
    }
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Floating Reaction Overlay */}
      <FloatingReactions incomingReaction={activeFloatingReaction} />

      {/* 1. TOP NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-primary/40 text-zinc-300 hover:text-white flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Tv className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-white tracking-tight">Watch Together</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Synchronized YouTube playback and live reactions for couples
            </p>
          </div>
        </div>

        {activeSession && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-primary/40 text-zinc-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Change Video</span>
            </button>

            <button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <PowerOff className="w-3.5 h-3.5 text-rose-400" />
              <span>End Room</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. LOADING STATE */}
      {isLoading && (
        <div className="soft-card rounded-3xl p-12 text-center text-xs text-zinc-400">
          Connecting to Watch Room...
        </div>
      )}

      {/* 3. ACTIVE WATCH ROOM */}
      {!isLoading && activeSession && (
        <div className="space-y-6">
          {/* Couple Romantic Status Bar */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center space-x-4">
              <div className="flex items-center -space-x-2">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name || 'Me'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary shrink-0"
                />
                <img
                  src={partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={partner?.name || 'Partner'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-border shrink-0"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {currentUser?.name.split(' ')[0]} &amp; {partner?.name.split(' ')[0] || 'Partner'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate max-w-xs sm:max-w-md">
                  Watching: <span className="text-rose-300 font-medium">{activeSession.title}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-full border border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Realtime Broadcast Active</span>
            </div>
          </div>

          {/* Main Grid: Left Video Player, Right Watch Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <YouTubePlayer
                session={activeSession}
                onReactionTriggered={handleTriggerReaction}
              />
            </div>

            <div className="lg:col-span-1">
              <WatchChat sessionId={activeSession.id} />
            </div>
          </div>
        </div>
      )}

      {/* 4. LOBBY & EMPTY STATE (NO ACTIVE SESSION) */}
      {!isLoading && !activeSession && (
        <div className="space-y-8">
          <div className="soft-card rounded-3xl p-8 sm:p-12 text-center border border-border space-y-6 relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-xl">
              <Tv className="w-10 h-10" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-white">No Active Watch Room</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Paste any YouTube link to watch synchronously with {partner?.name.split(' ')[0] || 'your partner'}.
                Play, pause, and seek actions synchronize automatically with zero latency!
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xl transition-all active:scale-95 inline-flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start a Watch Room</span>
            </button>
          </div>

          {/* Curated Suggestions Grid */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-white">Popular Couple Ideas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="soft-card soft-card-hover rounded-2xl p-5 border border-border cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                  🎧
                </div>
                <h4 className="text-sm font-bold text-white">Lo-Fi Study &amp; Sleep</h4>
                <p className="text-xs text-zinc-400">Relaxing beats to keep each other company during work or late-night calls.</p>
              </div>

              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="soft-card soft-card-hover rounded-2xl p-5 border border-border cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  🍿
                </div>
                <h4 className="text-sm font-bold text-white">Animated Short Films</h4>
                <p className="text-xs text-zinc-400">Award-winning romantic shorts to watch and discuss together.</p>
              </div>

              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="soft-card soft-card-hover rounded-2xl p-5 border border-border cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Scenic Travel Walks</h4>
                <p className="text-xs text-zinc-400">Explore Japan, Switzerland, or Paris in 4K for your future bucket list trips.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE ROOM MODAL */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

