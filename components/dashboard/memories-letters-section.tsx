'use client';

import React from 'react';
import Link from 'next/link';
import { ImageIcon, Mail, Lock, Unlock, ChevronRight, CheckSquare } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { useMemories } from '@/lib/queries/useMemories';
import { useLoveLetters } from '@/lib/queries/useLoveLetters';
import { formatDate, isLetterLocked } from '@/lib/utils';

export function MemoriesLettersSection() {
  const { bucketList } = useLDRStore();
  const { data: memories = [] } = useMemories();
  const { data: loveLetters = [] } = useLoveLetters();

  // Latest Memory
  const latestMemory = memories[0];

  // Latest / Sealed Love Letter
  const latestLetter = loveLetters[0];
  const isLocked = latestLetter ? isLetterLocked(latestLetter.unlock_date) : false;

  // Bucket list progress
  const completedBucketCount = bucketList.filter((b) => b.completed).length;

  return (
    <>
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
    </>
  );
}
