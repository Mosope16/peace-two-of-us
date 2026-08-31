'use client';

import React, { useState } from 'react';
import { Smile, Sparkles, X, Radio } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { getMoodDetails, formatTimeAgo, MOOD_OPTIONS, triggerLoveConfetti } from '@/lib/utils';
import { MoodType } from '@/types';
import { useMoods, useSetMood } from '@/lib/queries/useMoods';

export function MoodSection() {
  const { currentUser, partner } = useLDRStore();
  const { data: moods = [] } = useMoods();
  const setMood = useSetMood();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');

  const partnerMoodLog = partner ? moods.find((m) => m.user_id === partner.id) : null;
  const partnerMoodDetails = partnerMoodLog ? getMoodDetails(partnerMoodLog.mood as MoodType) : null;

  const myMoodLog = currentUser ? moods.find((m) => m.user_id === currentUser.id) : null;
  const myMoodDetails = myMoodLog ? getMoodDetails(myMoodLog.mood as MoodType) : null;

  const handleOpenModal = () => {
    setSelectedMood((myMoodLog?.mood as MoodType) || 'loved');
    setNote(myMoodLog?.note || '');
    setIsMoodModalOpen(true);
  };

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    setMood.mutate({
      mood: selectedMood,
      note: note.trim() || undefined,
    });

    triggerLoveConfetti();
    setIsMoodModalOpen(false);
  };

  return (
    <>
      <div className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span>Partner's Mood</span>
          </h3>
          <button
            onClick={handleOpenModal}
            className="text-[11px] font-semibold text-rose-400 hover:underline"
          >
            Update Mine
          </button>
        </div>

        {partnerMoodDetails ? (
          <div className={`p-4 rounded-xl border ${partnerMoodDetails.bgColor} flex items-center space-x-4 transition-all duration-300`}>
            <span className="text-4xl animate-bounce-short">{partnerMoodDetails.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className={`text-base font-bold ${partnerMoodDetails.color}`}>{partnerMoodDetails.label}</span>
                <span className="text-[10px] text-zinc-400">({formatTimeAgo(partnerMoodLog?.created_at || '')})</span>
              </div>
              {partnerMoodLog?.note && (
                <p className="text-xs text-zinc-300 italic mt-0.5 break-words">&ldquo;{partnerMoodLog.note}&rdquo;</p>
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
            <button
              onClick={handleOpenModal}
              className={`font-semibold flex items-center space-x-1.5 ${myMoodDetails.color} hover:underline`}
            >
              <span>{myMoodDetails.emoji}</span>
              <span>{myMoodDetails.label}</span>
            </button>
          ) : (
            <button onClick={handleOpenModal} className="text-rose-400 hover:underline">
              Tap to check in
            </button>
          )}
        </div>
      </div>

      {/* Mood Modal */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="soft-card w-full max-w-md rounded-2xl p-6 border border-border relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>How are you feeling?</span>
              </h3>
              <button onClick={() => setIsMoodModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Your partner {partner?.name.split(' ')[0] || 'loved one'} will see your updated mood in real time!
            </p>

            <form onSubmit={handleSaveMood} className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedMood(option.id as MoodType)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all hover:scale-105 ${
                      selectedMood === option.id
                        ? `${option.bgColor} ring-2 ring-rose-500 scale-105 shadow-md shadow-rose-500/20`
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-3xl mb-1">{option.emoji}</span>
                    <span className={`text-[10px] font-semibold ${option.color}`}>{option.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Add a quick note <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thinking of you at work / cozying up ❤️"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsMoodModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMood || setMood.isPending}
                  className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all disabled:opacity-50"
                >
                  {setMood.isPending ? 'Updating...' : 'Share Mood'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

