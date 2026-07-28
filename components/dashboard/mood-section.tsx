'use client';

import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { getMoodDetails, formatTimeAgo, MOOD_OPTIONS } from '@/lib/utils';
import { MoodType } from '@/types';
import { useMoods, useSetMood } from '@/lib/queries/useMoods';

export function MoodSection() {
  const { currentUser, partner } = useLDRStore();
  const { data: moods = [] } = useMoods();
  const setMood = useSetMood();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  const partnerMoodLog = partner ? moods.find(m => m.user_id === partner.id) : null;
  const partnerMoodDetails = partnerMoodLog ? getMoodDetails(partnerMoodLog.mood as MoodType) : null;

  const myMoodLog = currentUser ? moods.find(m => m.user_id === currentUser.id) : null;
  const myMoodDetails = myMoodLog ? getMoodDetails(myMoodLog.mood as MoodType) : null;

  const handleSetMood = (mood: MoodType) => {
    setMood.mutate({ mood });
    setIsMoodModalOpen(false);
  };

  return (
    <>
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
                  onClick={() => handleSetMood(option.id as MoodType)}
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
    </>
  );
}
