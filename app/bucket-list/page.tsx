'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Check, Trash2, Sparkles, X, Heart, Plane, Utensils, Compass } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { triggerLoveConfetti, formatDate } from '@/lib/utils';
import { BucketItem } from '@/types';
import { useBucketList, useAddBucketItem, useToggleBucketItem, useDeleteBucketItem } from '@/lib/queries/useBucketList';

export default function BucketListPage() {
  const { currentUser } = useLDRStore();
  const { data: bucketList = [] } = useBucketList();
  const addBucketItem = useAddBucketItem();
  const toggleBucketItem = useToggleBucketItem();
  const deleteBucketItem = useDeleteBucketItem();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BucketItem['category']>('travel');

  const completedCount = bucketList.filter((b) => b.completed).length;
  const progressPercent = bucketList.length > 0 ? Math.round((completedCount / bucketList.length) * 100) : 0;

  const filteredItems = bucketList.filter((item) => {
    if (activeFilter === 'pending') return !item.completed;
    if (activeFilter === 'completed') return item.completed;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addBucketItem.mutate({
      title,
      description,
      category,
      created_by: currentUser.id,
    });

    setTitle('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    toggleBucketItem.mutate({ id, completed: !currentlyCompleted });
    if (!currentlyCompleted) {
      triggerLoveConfetti();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Progress Bar */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
              <CheckSquare className="w-8 h-8 text-rose-400" />
              <span>Shared Couple Bucket List</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Dreams, adventures, and dates to complete together ❤️
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bucket Goal</span>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-rose-300">Relationship Dreams Completed</span>
            <span className="text-white font-mono">{completedCount} of {bucketList.length} ({progressPercent}%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-all duration-500 shadow-md shadow-rose-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'all' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
          }`}
        >
          All Goals ({bucketList.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'pending' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pending ({bucketList.length - completedCount})
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'completed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Completed ({completedCount}) 🎉
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border transition-all flex items-center justify-between gap-4 ${
              item.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/20'
            }`}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleToggle(item.id, item.completed)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                  item.completed
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-zinc-900/80 border-zinc-700 hover:border-rose-500 text-transparent'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>

              <div>
                <h3 className={`text-base font-bold transition-colors ${item.completed ? 'text-zinc-400 line-through' : 'text-white'}`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                )}
                {item.completed && item.completed_at && (
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    ✓ Unlocked on {formatDate(item.completed_at)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => deleteBucketItem.mutate(item.id)}
              className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Bucket Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <span>Add Bucket List Goal</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visit Japan / Learn salsa dancing"
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
                  <option value="travel">Travel &amp; Trips ✈️</option>
                  <option value="date">Special Dates ❤️</option>
                  <option value="life">Life Milestones 🏡</option>
                  <option value="creative">Fun &amp; Creative 🎨</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Notes / Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kyoto cherry blossom season"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
