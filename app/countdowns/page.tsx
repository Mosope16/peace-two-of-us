'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Plane, Heart, Cake, GraduationCap, Palmtree, Sparkles, X, Trash2, Edit3, Clock, AlertCircle } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { calculateCountdownDays, formatDate, triggerLoveConfetti } from '@/lib/utils';
import { Countdown } from '@/types';
import { useCountdowns, useAddCountdown, useUpdateCountdown, useDeleteCountdown } from '@/lib/queries/useCountdowns';

function getDefaultFutureDate(daysAhead = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setMinutes(0);
  d.setSeconds(0);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CountdownsPage() {
  const { currentUser } = useLDRStore();
  const { data: countdowns = [], isLoading } = useCountdowns();
  const addCountdown = useAddCountdown();
  const updateCountdown = useUpdateCountdown();
  const deleteCountdown = useDeleteCountdown();

  // Active live ticker update every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'passed'>('all');
  const [formError, setFormError] = useState<string | null>(null);

  // Add Form State
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Countdown['category']>('visit');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editCategory, setEditCategory] = useState<Countdown['category']>('visit');

  const handleOpenAddModal = () => {
    setTitle('');
    setTargetDate(getDefaultFutureDate(7));
    setCategory('visit');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cd: Countdown) => {
    setEditingCountdown(cd);
    setEditTitle(cd.title);
    try {
      const d = new Date(cd.target_date);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setEditTargetDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } catch {
      setEditTargetDate(getDefaultFutureDate(7));
    }
    setEditCategory(cd.category || 'visit');
    setFormError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a title for this countdown.');
      return;
    }

    if (!targetDate) {
      setFormError('Please select a target date and time.');
      return;
    }

    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      setFormError('Invalid date selected. Please pick a valid date.');
      return;
    }

    addCountdown.mutate(
      {
        title: title.trim(),
        target_date: parsedDate.toISOString(),
        category,
        created_by: currentUser?.id,
      },
      {
        onSuccess: () => {
          triggerLoveConfetti();
          setTitle('');
          setTargetDate('');
          setIsAddModalOpen(false);
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to save countdown.');
        },
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingCountdown || !editTitle.trim()) {
      setFormError('Please enter a title.');
      return;
    }

    if (!editTargetDate) {
      setFormError('Please select a target date.');
      return;
    }

    const parsedDate = new Date(editTargetDate);
    if (isNaN(parsedDate.getTime())) {
      setFormError('Invalid date selected. Please pick a valid date.');
      return;
    }

    updateCountdown.mutate(
      {
        id: editingCountdown.id,
        title: editTitle.trim(),
        target_date: parsedDate.toISOString(),
        category: editCategory,
      },
      {
        onSuccess: () => {
          setEditingCountdown(null);
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to update countdown.');
        },
      }
    );
  };

  const getCategoryBadge = (cat?: Countdown['category']) => {
    switch (cat) {
      case 'visit':
        return { icon: Plane, label: 'Airport Visit', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
      case 'anniversary':
        return { icon: Heart, label: 'Anniversary', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
      case 'birthday':
        return { icon: Cake, label: 'Birthday', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' };
      case 'graduation':
        return { icon: GraduationCap, label: 'Graduation', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
      case 'trip':
        return { icon: Palmtree, label: 'Vacation / Trip', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { icon: Calendar, label: 'Special Date', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
  };

  // Filter items
  const filteredCountdowns = countdowns.filter((cd) => {
    const time = calculateCountdownDays(cd.target_date);
    if (activeFilter === 'upcoming') return !time.isPassed;
    if (activeFilter === 'passed') return time.isPassed;
    return true;
  });

  const upcomingCount = countdowns.filter((cd) => !calculateCountdownDays(cd.target_date).isPassed).length;
  const passedCount = countdowns.filter((cd) => calculateCountdownDays(cd.target_date).isPassed).length;

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
            Real-time live tickers counting down every second to visits, anniversaries, birthdays, and trips ❤️
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center space-x-2 transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Countdown</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          All Countdowns ({countdowns.length})
        </button>
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'upcoming'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Upcoming ({upcomingCount}) ⏳
        </button>
        <button
          onClick={() => setActiveFilter('passed')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'passed'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Celebrated / Reached ({passedCount}) 🎉
        </button>
      </div>

      {/* Countdowns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="soft-card rounded-2xl p-6 border border-border animate-pulse h-48" />
          ))}
        </div>
      ) : filteredCountdowns.length === 0 ? (
        <div className="soft-card rounded-2xl p-12 text-center space-y-4">
          <Clock className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No countdowns found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {activeFilter === 'all'
              ? 'Set up your first countdown to look forward to special visits, birthdays, or trips!'
              : `No ${activeFilter} countdowns in this list.`}
          </p>
          {activeFilter === 'all' && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Countdown</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCountdowns.map((cd) => {
            const badge = getCategoryBadge(cd.category);
            const Icon = badge.icon;
            const time = calculateCountdownDays(cd.target_date);
            const isOptimistic = cd.id.startsWith('temp-');

            return (
              <div
                key={cd.id}
                className={`soft-card soft-card-hover rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
                  isOptimistic ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${badge.bg}`}>
                      <Icon className={`w-5 h-5 ${badge.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{cd.title}</h3>
                      <span className="text-[10px] text-zinc-400 font-medium block truncate">
                        Target: {formatDate(cd.target_date, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(cd)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Edit Countdown"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCountdown.mutate(cd.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Countdown"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Real-time 4-Column Ticker Display */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center py-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-gradient block">{time.days}</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Days</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-white block">{time.hours}</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Hours</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-white block">{time.minutes}</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Mins</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono block">{time.seconds}</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Secs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <span className={`font-semibold ${badge.color}`}>{badge.label}</span>
                  <span className={time.isPassed ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                    {time.isPassed ? 'Reached & Celebrated 🎉' : 'In Progress ⏳'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Airport Reunion / Hawaii Trip"
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
                  <option value="trip">Vacation / Trip 🌴</option>
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
                  disabled={addCountdown.isPending}
                  className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {addCountdown.isPending ? 'Saving...' : 'Save Countdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Countdown Modal */}
      {editingCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="soft-card w-full max-w-md rounded-2xl p-6 border border-border relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-rose-400" />
                <span>Edit Countdown</span>
              </h3>
              <button onClick={() => setEditingCountdown(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="visit">Airport / Visit ✈️</option>
                  <option value="anniversary">Anniversary ❤️</option>
                  <option value="birthday">Birthday 🎉</option>
                  <option value="graduation">Graduation 🎓</option>
                  <option value="trip">Vacation / Trip 🌴</option>
                  <option value="custom">Custom Milestone ✨</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCountdown(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCountdown.isPending}
                  className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {updateCountdown.isPending ? 'Updating...' : 'Update Countdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

