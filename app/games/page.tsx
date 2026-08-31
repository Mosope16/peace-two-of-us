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
      case 'know-me': return 'Know Me';
      case 'this-or-that': return 'This or That';
      case 'would-you-rather': return 'Would You Rather';
      case 'compatibility': return 'Compatibility Quiz';
      case 'iq-duel': return 'IQ Duel';
      case 'riddles': return 'Riddle Night';
      default: return 'Game';
    }
  };

  const getGameLink = (type: string) => {
    switch (type) {
      case 'know-me': return '/games/know-me';
      case 'this-or-that': return '/games/this-or-that';
      case 'would-you-rather': return '/games/would-you-rather';
      case 'compatibility': return '/games/compatibility';
      case 'iq-duel': return '/games/iq-duel';
      case 'riddles': return '/games/riddle-night';
      default: return '/games';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="soft-card p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Gamepad2 className="w-48 h-48 sm:w-64 sm:h-64 text-primary" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Couple Games &amp; Duels</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Play, Compete &amp; Discover More About <span className="text-primary">Each Other</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed">
            Fun, competitive, and intimate mini-games designed specifically for long-distance couples. Test how well you know {partner?.name.split(' ')[0]}, duel in timed intelligence tests, and solve riddles together.
          </p>
        </div>
      </div>

      {/* ACTIVE SESSIONS AND INVITATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pending Invitations */}
        <section className="soft-card p-8 space-y-4 shadow-sm border border-border">
          <div className="flex items-center space-x-2 border-b border-border pb-4">
            <Inbox className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-bold text-white">Pending Invitations</h2>
            {invitations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-bold">
                {invitations.length}
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {invitesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No pending game invitations</p>
            ) : (
              invitations.map(invite => (
                <div key={invite.id} className="bg-surface rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md disabled:opacity-50"
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
        <section className="soft-card p-8 space-y-4 shadow-sm border border-border">
          <div className="flex items-center space-x-2 border-b border-border pb-4">
            <Radio className="w-5 h-5 text-green-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Active Games</h2>
            {sessions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                {sessions.length}
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No active games right now</p>
            ) : (
              sessions.map(session => (
                <div key={session.id} className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{getGameLabel(session.game_type)}</h3>
                    <p className="text-[10px] text-zinc-400 mt-1 capitalize">
                      Status: <span className="text-green-400 font-semibold">{session.status.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  <Link
                    href={`${getGameLink(session.game_type)}?session=${session.id}`}
                    className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition-colors"
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
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg text-white font-bold">
              <Gamepad2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">How Well Do You Know Me?</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                One partner answers privately, the other guesses! Switch roles and compare scores at the end.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Turn-Based</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">17 Categories</span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('know-me', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/know-me"
              className="flex-[2] py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Know Me</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 2. This or That */}
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shadow-lg text-white font-bold">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-secondary transition-colors">This or That</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Both choose independently between two options. Reveal together for instant 🎉 Match bonuses!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">Match Answers</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border">Quick Rounds</span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('this-or-that', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/this-or-that"
              className="flex-[2] py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play This or That</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3. Would You Rather */}
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg text-white font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">Would You Rather</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Choose between wild &amp; romantic relationship scenarios. Compare choices together!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">Scenarios</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-zinc-300 border border-border">Fun Topics</span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('would-you-rather', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/would-you-rather"
              className="flex-[2] py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Would You Rather</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4. Compatibility Quiz */}
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg text-white font-bold">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">Compatibility Quiz</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Answer relationship &amp; lifestyle questions to uncover your overall couple compatibility percentage!
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-border">% Score Breakdown</span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('compatibility', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/compatibility"
              className="flex-[2] py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 5. IQ Duel */}
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg text-white font-bold">
              <Brain className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors">IQ Duel</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Competitive intelligence battle! Per-question clocks and double points on the final round.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('iq-duel', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/iq-duel"
              className="flex-[2] py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play IQ Duel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 6. Riddle Night */}
        <div className="soft-card soft-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg text-white font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">Riddle Night</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Solve love &amp; LDR riddles together to earn achievement badges.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                sendInvite.mutate('riddles', {
                  onSuccess: () => alert('Invitation sent!'),
                  onError: (err: any) => alert(`Error: ${err.message || 'Failed to send invite'}`)
                });
              }}
              disabled={sendInvite.isPending}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-zinc-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-border"
            >
              {sendInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Invite</span>}
            </button>
            <Link
              href="/games/riddle-night"
              className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <span>Play Riddle Night</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Expandable / More to Come Section */}
      <div className="soft-card p-6 text-center space-y-3 bg-surface/50 border border-border">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface text-zinc-400 text-xs font-semibold border border-border">
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
