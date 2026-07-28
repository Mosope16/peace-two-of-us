'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Calendar, User, Trash2, Search, X, Sparkles, Loader2 } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { formatDate, triggerLoveConfetti } from '@/lib/utils';
import { Memory } from '@/types';
import { useMemories, useAddMemory, useDeleteMemory } from '@/lib/queries/useMemories';

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
];

export default function MemoriesPage() {
  const { currentUser, partner } = useLDRStore();
  const { data: memories = [], isLoading } = useMemories();
  const addMemory = useAddMemory();
  const deleteMemory = useDeleteMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredMemories = memories.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addMemory.mutate({
      title,
      description,
      image_url: imageUrl,
      date: new Date(date).toISOString(),
    });

    triggerLoveConfetti();

    // Reset Form
    setTitle('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <ImageIcon className="w-8 h-8 text-rose-400" />
            <span>Memories Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Preserve your favorite moments, trips, calls, and dates together ❤️
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center space-x-2 transition-transform hover:scale-105 disabled:opacity-50"
          disabled={addMemory.isPending}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Memory</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
        />
      </div>

      {/* Memory Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No memories found</h3>
          <p className="text-xs text-zinc-400">Start by capturing your first memory together!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => {
            const isCreator = mem.created_by === currentUser.id;
            const creatorName = isCreator ? currentUser.name.split(' ')[0] : partner?.name.split(' ')[0] || 'Partner';
            const isOptimistic = mem.id.startsWith('temp-');

            return (
              <div
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className={`glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer group border border-rose-500/20 flex flex-col ${isOptimistic ? 'opacity-50' : ''}`}
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  <img
                    src={mem.image_url || PRESET_PHOTOS[0]}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-rose-300">
                    {formatDate(mem.date)}
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                      {mem.title}
                    </h3>
                    <p className="text-xs text-zinc-300 line-clamp-2 mt-1 leading-relaxed">
                      {mem.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-rose-400" />
                      <span>Added by {creatorName}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMemory.mutate(mem.id);
                      }}
                      disabled={deleteMemory.isPending || isOptimistic}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      title="Delete Memory"
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

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-rose-500/30 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <span>Create New Memory</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Video Call / Beach Sunset"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description / Story</label>
                <textarea
                  rows={3}
                  placeholder="What made this moment so special?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Select Photo or Image URL</label>
                <input
                  type="url"
                  placeholder="Image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 mb-2"
                />

                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_PHOTOS.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === img ? 'border-rose-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
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
                  disabled={addMemory.isPending}
                  className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {addMemory.isPending ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-card w-full max-w-2xl rounded-3xl overflow-hidden border border-rose-500/30 shadow-2xl relative space-y-4">
            <div className="relative aspect-video bg-black">
              <img src={selectedMemory.image_url} alt={selectedMemory.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <span className="text-xs font-semibold text-rose-400">{formatDate(selectedMemory.date)}</span>
              <h2 className="text-2xl font-bold text-white">{selectedMemory.title}</h2>
              <p className="text-sm text-zinc-300 leading-relaxed font-serif">{selectedMemory.description}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
