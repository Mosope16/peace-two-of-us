'use client';

import React, { useState } from 'react';
import { Mail, Plus, Lock, Unlock, Calendar, User, Trash2, Clock, Sparkles, X, Heart, Loader2 } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { formatDate, calculateCountdownDays, isLetterLocked, triggerLoveConfetti } from '@/lib/utils';
import { LoveLetter } from '@/types';
import { useLoveLetters, useAddLoveLetter, useDeleteLoveLetter, useMarkLetterRead } from '@/lib/queries/useLoveLetters';

export default function LoveLettersPage() {
  const { currentUser, partner } = useLDRStore();
  const { data: loveLetters = [], isLoading } = useLoveLetters();
  const addLoveLetter = useAddLoveLetter();
  const deleteLoveLetter = useDeleteLoveLetter();
  const markLetterRead = useMarkLetterRead();

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addLoveLetter.mutate({
      title,
      content,
      unlock_date: unlockDate ? new Date(unlockDate).toISOString() : undefined,
    });

    triggerLoveConfetti();

    setTitle('');
    setContent('');
    setUnlockDate('');
    setIsWriteModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Mail className="w-8 h-8 text-pink-400" />
            <span>Love Letters Mailbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Exchange private digital letters &amp; time-locked envelopes sealed until special dates ❤️
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center space-x-2 transition-transform hover:scale-105 disabled:opacity-50"
          disabled={addLoveLetter.isPending}
        >
          <Plus className="w-4 h-4" />
          <span>Write Love Letter</span>
        </button>
      </div>

      {/* Letters Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : loveLetters.length === 0 ? (
        <div className="soft-card rounded-2xl p-12 text-center space-y-3">
          <Mail className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Your Mailbox is Empty</h3>
          <p className="text-xs text-zinc-400">Write your first letter to bring a big smile to your partner!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loveLetters.map((letter) => {
            const locked = isLetterLocked(letter.unlock_date);
            const countdown = letter.unlock_date ? calculateCountdownDays(letter.unlock_date) : null;
            const isAuthor = letter.created_by === currentUser.id;
            const authorName = isAuthor ? currentUser.name.split(' ')[0] : partner?.name.split(' ')[0] || 'Partner';
            const isOptimistic = letter.id.startsWith('temp-');

            return (
              <div
                key={letter.id}
                onClick={() => {
                  if ((!locked || isAuthor) && !isOptimistic) {
                    if (!letter.is_read && !isAuthor) {
                      markLetterRead.mutate(letter.id);
                    }
                    setSelectedLetter(letter);
                  }
                }}
                className={`envelope-bg rounded-2xl p-6 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${ locked ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-border hover:border-border hover:shadow-xl hover:shadow-pink-500/10' } ${isOptimistic ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${locked ? 'bg-amber-500/10 text-amber-400' : 'bg-pink-500/10 text-pink-400'}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">From {authorName}</span>
                  </div>

                  {locked ? (
                    <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Lock className="w-3 h-3" />
                      <span>Locked until {formatDate(letter.unlock_date || '')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-border">
                      <Unlock className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{letter.title}</h3>
                  {locked && !isAuthor ? (
                    <div className="py-4 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center space-y-2">
                      <Lock className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
                      <p className="text-xs text-amber-300 font-semibold">Sealed for an upcoming surprise!</p>
                      {countdown && (
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Unlocks in {countdown.days}d {countdown.hours}h {countdown.minutes}m
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-300 line-clamp-3 font-serif italic leading-relaxed">
                      &ldquo;{letter.content}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                  <span>Written on {formatDate(letter.created_at)}</span>
                  <div className="flex items-center space-x-2">
                    {(!locked || isAuthor) && (
                      <span className="text-pink-300 font-semibold hover:underline">Read Letter &rarr;</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLoveLetter.mutate(letter.id);
                      }}
                      disabled={deleteLoveLetter.isPending || isOptimistic}
                      className="p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Letter Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="soft-card w-full max-w-lg rounded-2xl p-6 border border-border relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <span>Write a Private Love Letter</span>
              </h3>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWriteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Letter Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Open on your birthday / Thinking of you"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Optional Time-Lock Unlock Date (Leave blank to send immediately)
                </label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Your Message</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write your heart out..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-serif text-sm focus:outline-none focus:border-pink-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoveLetter.isPending}
                  className="px-6 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {addLoveLetter.isPending ? 'Sealing...' : 'Seal & Send Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Letter Reading Overlay */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="soft-card w-full max-w-2xl rounded-3xl p-8 border border-border relative space-y-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLetter(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-zinc-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-border flex items-center justify-center text-pink-400">
                <Heart className="w-5 h-5 fill-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLetter.title}</h2>
                <span className="text-xs text-zinc-400">Sent on {formatDate(selectedLetter.created_at)}</span>
              </div>
            </div>

            <div className="py-4 whitespace-pre-wrap font-serif text-base text-zinc-200 leading-relaxed italic border-l-2 border-border pl-6">
              {selectedLetter.content}
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={() => setSelectedLetter(null)}
                className="px-6 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs"
              >
                Close Letter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
