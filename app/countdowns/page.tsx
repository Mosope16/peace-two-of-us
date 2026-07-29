'use client';

import React, { useState } from 'react';
import { Calendar, Plus, Plane, Heart, Cake, GraduationCap, MapPin, Trash2, Clock, Sparkles, X } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { calculateCountdownDays, formatDate, triggerLoveConfetti } from '@/lib/utils';
import { Countdown } from '@/types';
import { useCountdowns, useAddCountdown, useDeleteCountdown } from '@/lib/queries/useCountdowns';

export default function CountdownsPage() {
  const { currentUser } = useLDRStore();
  const { data: countdowns = [] } = useCountdowns();
  const addCountdown = useAddCountdown();
  const deleteCountdown = useDeleteCountdown();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Countdown['category']>('visit');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    addCountdown.mutate({
      title,
      target_date: new Date(targetDate).toISOString(),
      category,
      created_by: currentUser.id,
    });

    triggerLoveConfetti();

    setTitle('');
    setTargetDate('');
    setIsAddModalOpen(false);
  };

  const getCategoryBadge = (cat?: Countdown['category']) => {
    switch (cat) {
      case 'visit':
        return { icon: Plane, label: 'Airport Visit', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
      case 'anniversary':
        return { icon: Heart, label: 'Anniversary', color: 'text-rose-400', bg: 'bg-rose-500/10 border-border' };
      case 'birthday':
        return { icon: Cake, label: 'Birthday', color: 'text-pink-400', bg: 'bg-pink-500/10 border-border' };
      case 'graduation':
        return { icon: GraduationCap, label: 'Graduation', color: 'text-purple-400', bg: 'bg-purple-500/10 border-border' };
      default:
        return { icon: Calendar, label: 'Special Date', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-rose-400" />
            <span>Relationship Countdowns</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track every second counting down to visits, anniversaries, birthdays, and trips ❤️
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl hover:hover:text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center space-x-2 transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Countdown</span>
        </button>
      </div>

      {/* Countdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countdowns.map((cd) => {
          const badge = getCategoryBadge(cd.category);
          const Icon = badge.icon;
          const time = calculateCountdownDays(cd.target_date);

          return (
            <div
              key={cd.id}
              className="soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${badge.bg}`}>
                    <Icon className={`w-5 h-5 ${badge.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{cd.title}</h3>
                    <span className="text-[10px] text-zinc-400 font-medium">Target: {formatDate(cd.target_date)}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteCountdown.mutate(cd.id)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Ticker Display */}
              <div className="grid grid-cols-3 gap-2 text-center py-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-3xl font-black text-gradient">{time.days}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Days</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white">{time.hours}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Hours</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white">{time.minutes}</span>
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Mins</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className={`font-semibold ${badge.color}`}>{badge.label}</span>
                <span>{time.isPassed ? 'Reached 🎉' : 'In Progress...'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Countdown Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="soft-card w-full max-w-md rounded-2xl p-6 border border-border relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <span>Create Custom Countdown</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Airport Visit / Hawaii Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="visit">Airport / Visit ✈️</option>
                  <option value="anniversary">Anniversary ❤️</option>
                  <option value="birthday">Birthday 🎉</option>
                  <option value="graduation">Graduation 🎓</option>
                  <option value="custom">Custom Milestone ✨</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md"
                >
                  Save Countdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
