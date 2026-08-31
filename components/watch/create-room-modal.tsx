'use client';

import React, { useState } from 'react';
import { X, Tv, Sparkles, Film, ArrowRight } from 'lucide-react';
import { extractYouTubeId, useCreateWatchSession } from '@/lib/queries/useWatchTogether';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sessionId: string) => void;
}

const PRESET_SUGGESTIONS = [
  {
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    tag: 'Cozy Beats',
    id: 'jfKfPfyJRdk',
  },
  {
    title: '4K Cozy Fireplace with Crackling Fire Sounds',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    tag: 'Atmosphere',
    id: 'L_LUpnjgPso',
  },
  {
    title: 'Paperman - Disney Academy Award Winning Short',
    url: 'https://www.youtube.com/watch?v=1QAI4B_UIUQ',
    tag: 'Romantic Short',
    id: '1QAI4B_UIUQ',
  },
  {
    title: 'Switzerland 4K - Scenic Relaxation Film with Piano',
    url: 'https://www.youtube.com/watch?v=linlz7-Pnvw',
    tag: 'Travel & Peace',
    id: 'linlz7-Pnvw',
  },
];

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createSessionMutation = useCreateWatchSession();

  if (!isOpen) return null;

  const extractedId = extractYouTubeId(urlInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedId) {
      setErrorMsg('Please enter a valid YouTube video URL or 11-character video ID');
      return;
    }

    try {
      setErrorMsg(null);
      const session = await createSessionMutation.mutateAsync({
        urlOrId: urlInput,
        title: titleInput.trim() || undefined,
      });
      onSuccess?.(session.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create watch session');
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SUGGESTIONS[0]) => {
    setUrlInput(preset.url);
    setTitleInput(preset.title);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="soft-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-border relative space-y-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Start a Watch Together Room</h3>
            <p className="text-xs text-zinc-400">Watch YouTube synchronized with your partner in real-time</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">YouTube Video URL or ID</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/90 border border-zinc-800 focus:border-primary focus:outline-none text-xs text-white placeholder:text-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Room / Video Title (Optional)</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. Our Movie Night / Lo-Fi Chill"
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/90 border border-zinc-800 focus:border-primary focus:outline-none text-xs text-white placeholder:text-zinc-500"
            />
          </div>

          {/* YouTube Thumbnail Preview */}
          {extractedId && (
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <img
                src={`https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`}
                alt="Preview"
                className="w-20 h-14 object-cover rounded-xl border border-zinc-700/60"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {titleInput || `YouTube Video ID: ${extractedId}`}
                </p>
                <p className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                  <span>✓ Valid YouTube Video</span>
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Quick Suggestions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">Quick Ideas for Couples:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SUGGESTIONS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-primary/40 text-left transition-all group"
                >
                  <Film className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{preset.tag}</span>
                    <p className="text-[11px] text-zinc-300 font-medium truncate group-hover:text-white">{preset.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createSessionMutation.isPending || !urlInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all active:scale-95"
            >
              <span>{createSessionMutation.isPending ? 'Creating Room...' : 'Start Watch Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

