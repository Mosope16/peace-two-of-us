'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Calendar, 
  Smile, 
  ImageIcon, 
  Mail, 
  Clock, 
  CheckSquare, 
  ArrowRight, 
  Sparkles,
  Plane,
  Gift,
  Plus,
  ChevronRight,
  Lock,
  Unlock,
  Gamepad2,
  Brain
} from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { 
  calculateDaysTogether, 
  calculateCountdownDays, 
  getMoodDetails, 
  formatDate, 
  formatTimeAgo,
  isLetterLocked,
  MOOD_OPTIONS,
  triggerLoveConfetti
} from '@/lib/utils';
import { MoodType } from '@/types';

import { useEffect } from 'react';
import { subscribeToCoupleRealtime } from '@/lib/auth';

export default function DashboardPage() {
  const { 
    currentUser, 
    partner, 
    couple, 
    memories, 
    loveLetters, 
    moods, 
    countdowns, 
    bucketList, 
    setMood,
    updatePartnerProfile
  } = useLDRStore();

  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  useEffect(() => {
    if (couple && couple.id) {
      const unsubscribe = subscribeToCoupleRealtime(couple.id, (partnerUser) => {
        updatePartnerProfile(partnerUser);
        triggerLoveConfetti();
      });
      return () => unsubscribe();
    }
  }, [couple.id, updatePartnerProfile]);

  const daysTogether = calculateDaysTogether(couple.relationship_start_date);
  
  // Find Next Visit countdown and Next Anniversary countdown
  const nextVisitCountdown = countdowns.find((c) => c.category === 'visit') || countdowns[0];
  const nextAnniversaryCountdown = countdowns.find((c) => c.category === 'anniversary') || countdowns[1];

  const visitDays = nextVisitCountdown ? calculateCountdownDays(nextVisitCountdown.target_date) : null;
  const annivDays = nextAnniversaryCountdown ? calculateCountdownDays(nextAnniversaryCountdown.target_date) : null;

  // Partner & Current Mood
  const partnerMoodLog = partner ? moods[partner.id] : null;
  const partnerMoodDetails = partnerMoodLog ? getMoodDetails(partnerMoodLog.mood) : null;

  const myMoodLog = moods[currentUser.id];
  const myMoodDetails = myMoodLog ? getMoodDetails(myMoodLog.mood) : null;

  // Latest Memory
  const latestMemory = memories[0];

  // Latest / Sealed Love Letter
  const latestLetter = loveLetters[0];
  const isLocked = latestLetter ? isLetterLocked(latestLetter.unlock_date) : false;

  // Bucket list progress
  const completedBucketCount = bucketList.filter((b) => b.completed).length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO COUPLE BANNER & DAYS TOGETHER COUNTER */}
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
              <img
                src={couple.partner_two?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'}
                alt={couple.partner_two?.name || 'Partner'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-pink-500/40 shadow-lg -ml-4"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {couple.partner_one.name.split(' ')[0]} &amp; {couple.partner_two?.name.split(' ')[0] || 'Partner'}
                </h1>
                <button onClick={triggerLoveConfetti} title="Celebrate Love!" className="text-xl hover:scale-125 transition-transform">
                  🎉
                </button>
              </div>
              <p className="text-xs sm:text-sm text-rose-300 font-medium flex items-center space-x-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Connected &bull; Invite Code: <span className="font-mono font-bold text-white bg-rose-500/20 px-1.5 py-0.5 rounded" suppressHydrationWarning>{couple.invite_code}</span></span>
              </p>
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

      {/* 2. CORE DASHBOARD GRID: COUNTDOWNS + PARTNER MOOD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Next Visit Countdown Card */}
        {nextVisitCountdown && visitDays && (
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 flex flex-col justify-between space-y-4">
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
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">{nextAnniversaryCountdown.title}</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
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

        {/* Partner Mood Card + Quick Mood Logger */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Smile className="w-4 h-4 text-amber-400" />
              <span>Partner's Mood</span>
            </h3>
            <button
              onClick={() => setIsMoodModalOpen(true)}
              className="text-[11px] font-semibold text-rose-400 hover:underline"
            >
              Update Mine
            </button>
          </div>

          {partnerMoodDetails ? (
            <div className={`p-4 rounded-xl border ${partnerMoodDetails.bgColor} flex items-center space-x-4`}>
              <span className="text-4xl">{partnerMoodDetails.emoji}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-base font-bold ${partnerMoodDetails.color}`}>{partnerMoodDetails.label}</span>
                  <span className="text-[10px] text-zinc-400">({formatTimeAgo(partnerMoodLog?.created_at || '')})</span>
                </div>
                {partnerMoodLog?.note && (
                  <p className="text-xs text-zinc-300 italic mt-0.5">&ldquo;{partnerMoodLog.note}&rdquo;</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400">
              No mood check-in from partner today yet
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-zinc-400">Your mood:</span>
            {myMoodDetails ? (
              <span className={`font-semibold flex items-center space-x-1 ${myMoodDetails.color}`}>
                <span>{myMoodDetails.emoji}</span>
                <span>{myMoodDetails.label}</span>
              </span>
            ) : (
              <button onClick={() => setIsMoodModalOpen(true)} className="text-rose-400 hover:underline">
                Tap to check in
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. RECENT MEMORY & LOVE LETTER HIGHLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Latest Memory Preview Card */}
        {latestMemory && (
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-rose-400" />
                <span>Latest Memory</span>
              </h3>
              <Link href="/memories" className="text-xs font-semibold text-rose-300 hover:underline flex items-center space-x-1">
                <span>View Gallery</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative rounded-xl overflow-hidden group aspect-video border border-zinc-800">
              <img
                src={latestMemory.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'}
                alt={latestMemory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider mb-1">
                  {formatDate(latestMemory.date)}
                </span>
                <h4 className="text-base font-bold text-white">{latestMemory.title}</h4>
                <p className="text-xs text-zinc-300 line-clamp-2 mt-1">{latestMemory.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Love Letter Notice Card */}
        {latestLetter && (
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-rose-500/20 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Mail className="w-5 h-5 text-pink-400" />
                <span>Love Letter</span>
              </h3>
              <Link href="/letters" className="text-xs font-semibold text-pink-300 hover:underline flex items-center space-x-1">
                <span>Open Mailbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="envelope-bg rounded-xl p-5 border border-pink-500/30 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300">{latestLetter.title}</span>
                {isLocked ? (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Sealed</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Unlock className="w-3 h-3" />
                    <span>Unlocked</span>
                  </span>
                )}
              </div>

              {isLocked ? (
                <div className="py-2 text-center space-y-1">
                  <p className="text-xs text-zinc-300 italic">
                    &ldquo;This letter is time-locked until {formatDate(latestLetter.unlock_date || '')}&rdquo;
                  </p>
                  <p className="text-[10px] text-amber-400 font-semibold">🔒 Sealed with a countdown timer</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-300 line-clamp-3 italic font-serif leading-relaxed">
                  &ldquo;{latestLetter.content}&rdquo;
                </p>
              )}

              <div className="flex justify-end pt-1">
                <Link
                  href="/letters"
                  className="px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all"
                >
                  {isLocked ? 'View Timer' : 'Read Full Letter'}
                </Link>
              </div>
            </div>

            {/* Shared Bucket List Snippet */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
              <span className="text-zinc-400 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                <span>Bucket List Progress:</span>
              </span>
              <Link href="/bucket-list" className="font-bold text-rose-300 hover:underline">
                {completedBucketCount} / {bucketList.length} Goals Completed 🎉
              </Link>
            </div>
          </div>
        )}

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
              Play Know Me Quiz (Long Distance, 18+ Spicy, Pop Culture), challenge {partner?.name.split(' ')[0]} to a timed IQ Duel with private lock-ins, or solve Riddle Night puzzles together!
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

      {/* Mood Modal */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gradient text-center mb-1">Select your mood</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">
              Partner {partner?.name.split(' ')[0]} will see your updated mood immediately.
            </p>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setMood(option.id as MoodType);
                    setIsMoodModalOpen(false);
                  }}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all hover:scale-105 ${
                    myMoodLog?.mood === option.id
                      ? `${option.bgColor} ring-2 ring-rose-500`
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-3xl mb-1">{option.emoji}</span>
                  <span className={`text-[10px] font-semibold ${option.color}`}>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsMoodModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
