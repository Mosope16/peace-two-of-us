'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Brain, HelpCircle, Sparkles, ArrowRight, ShieldAlert, Award, Lock, Zap, Users, ShieldCheck, CheckCircle2, Copy, Radio, Inbox, Loader2, Play } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { 
  useGameInvitations, 
  useAcceptGameInvitation, 
  useDeclineGameInvitation, 
  useSendGameInvitation 
} from '@/lib/queries/useGameInvitations';
import { useActiveGameSessions } from '@/lib/queries/useGameSessions';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function GamesHubPage() {
  const { currentUser, partner, couple } = useLDRStore();
  const router = useRouter();

  const { data: invitations = [], isLoading: invitesLoading } = useGameInvitations();
  const { data: sessions = [], isLoading: sessionsLoading } = useActiveGameSessions();

  const sendInvite = useSendGameInvitation();
  const acceptInvite = useAcceptGameInvitation();
  const declineInvite = useDeclineGameInvitation();

  const handleAccept = async (inviteId: string, gameType: string) => {
    try {
      const sessionId = await acceptInvite.mutateAsync(inviteId);
      if (sessionId) {
        router.push(`${getGameLink(gameType)}?session=${sessionId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getGameLabel = (type: string) => {
    switch (type) {
      case 'know_me': return 'Know Me';
      case 'this_or_that': return 'This or That';
      case 'would_you_rather': return 'Would You Rather';
      case 'compatibility': return 'Compatibility Quiz';
      case 'iq_duel': return 'IQ Duel';
      case 'riddle_night': return 'Riddle Night';
      default: return 'Game';
    }
  };

  const getGameLink = (type: string) => {
    switch (type) {
      case 'know_me': return '/games/know-me';
      case 'this_or_that': return '/games/this-or-that';
      case 'would_you_rather': return '/games/would-you-rather';
      case 'compatibility': return '/games/compatibility';
      case 'iq_duel': return '/games/iq-duel';
      case 'riddle_night': return '/games/riddle-night';
      default: return '/games';
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

      {/* ACTIVE SESSIONS AND INVITATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pending Invitations */}
        <section className="glass-card rounded-2xl p-6 sm:p-8 border border-rose-500/30 space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-4">
            <Inbox className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Pending Invitations</h2>
            {invitations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
                {invitations.length}
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {invitesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No pending game invitations</p>
            ) : (
              invitations.map(invite => (
                <div key={invite.id} className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{getGameLabel(invite.game_type)}</h3>
                    <p className="text-xs text-zinc-400 mt-1">From {partner?.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Sent {formatDate(invite.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => declineInvite.mutate(invite.id)}
                      disabled={declineInvite.isPending || acceptInvite.isPending}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(invite.id, invite.game_type)}
                      disabled={acceptInvite.isPending || declineInvite.isPending}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md disabled:opacity-50"
                    >
                      Accept & Play
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Active Sessions */}
        <section className="glass-card rounded-2xl p-6 sm:p-8 border border-emerald-500/30 space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-4">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Active Games</h2>
            {sessions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                {sessions.length}
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No active games right now</p>
            ) : (
              sessions.map(session => (
                <div key={session.id} className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{getGameLabel(session.game_type)}</h3>
                    <p className="text-[10px] text-zinc-400 mt-1 capitalize">
                      Status: <span className="text-emerald-400 font-semibold">{session.status.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  <Link
                    href={`${getGameLink(session.game_type)}?session=${session.id}`}
                    className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

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

          <div className="flex gap-2 w-full">
            <button
              onClick={() => sendInvite.mutate('know_me')}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-zinc-700"
            >
              <span>Invite</span>
            </button>
            <Link
              href="/games/know-me"
              className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Know Me</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

          <div className="flex gap-2 w-full">
            <button
              onClick={() => sendInvite.mutate('this_or_that')}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-zinc-700"
            >
              <span>Invite</span>
            </button>
            <Link
              href="/games/this-or-that"
              className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play This or That</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

          <div className="flex gap-2 w-full">
            <button
              onClick={() => sendInvite.mutate('would_you_rather')}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-zinc-700"
            >
              <span>Invite</span>
            </button>
            <Link
              href="/games/would-you-rather"
              className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Would You Rather</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
