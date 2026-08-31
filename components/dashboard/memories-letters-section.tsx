'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Lock, Unlock, ChevronRight, CheckSquare, Plus, Clock } from 'lucide-react';
import { useLoveLetters } from '@/lib/queries/useLoveLetters';
import { useBucketList } from '@/lib/queries/useBucketList';
import { formatDate, isLetterLocked } from '@/lib/utils';

export function MemoriesLettersSection() {
  const { data: loveLetters = [] } = useLoveLetters();
  const { data: bucketList = [] } = useBucketList();

  // Latest / Sealed Love Letter
  const latestLetter = loveLetters[0];
  const isLocked = latestLetter ? isLetterLocked(latestLetter.unlock_date) : false;

  // Bucket list progress
  const completedBucketCount = bucketList.filter((b) => b.completed).length;
  const progressPercent = bucketList.length > 0 ? Math.round((completedBucketCount / bucketList.length) * 100) : 0;
  const recentGoal = bucketList.find((b) => !b.completed) || bucketList[0];

  return (
    <>
      {/* Love Letter Card */}
      <div className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Mail className="w-5 h-5 text-pink-400" />
            <span>Love Letter Mailbox</span>
          </h3>
          <Link href="/letters" className="text-xs font-semibold text-pink-300 hover:underline flex items-center space-x-1">
            <span>{latestLetter ? 'Open Mailbox' : 'Write Letter'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {latestLetter ? (
          <div className="envelope-bg rounded-xl p-5 border border-border space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-300">{latestLetter.title}</span>
              {isLocked ? (
                <span className="flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Sealed</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-border">
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
                className="px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-border text-pink-300 text-xs font-bold transition-all"
              >
                {isLocked ? 'View Timer' : 'Read Full Letter'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center space-y-3">
            <p className="text-xs text-zinc-400">No letters written yet. Surprise your partner with a heartfelt message!</p>
            <Link
              href="/letters"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write First Letter</span>
            </Link>
          </div>
        )}
      </div>

      {/* Shared Bucket List Highlight Card */}
      <div className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <span>Shared Bucket List</span>
          </h3>
          <Link href="/bucket-list" className="text-xs font-semibold text-purple-300 hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/80 border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold">Couple Progress</span>
            <span className="font-bold text-purple-300">{completedBucketCount} / {bucketList.length} Completed</span>
          </div>

          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-500 bg-purple-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {recentGoal && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 truncate max-w-[200px]">🎯 Next: <strong className="text-white">{recentGoal.title}</strong></span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize">{recentGoal.category || 'Goal'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <Link href="/timeline" className="text-zinc-400 hover:text-white flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>View Relationship Timeline</span>
          </Link>
          <Link href="/bucket-list" className="text-purple-300 font-semibold hover:underline">
            + Add New Goal
          </Link>
        </div>
      </div>
    </>
  );
}

