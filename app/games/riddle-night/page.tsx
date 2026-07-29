'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Sparkles, Lightbulb, CheckCircle2, Eye, Key } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { RIDDLES_DATA } from '@/lib/games-data';

export default function RiddleNightPage() {
  const { currentUser, partner, riddlesSolved, solveRiddle } = useLDRStore();
  const [openHintId, setOpenHintId] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  const handleRevealAnswer = (riddleId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [riddleId]: true }));
    solveRiddle(riddleId);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games Hub</span>
        </Link>

        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-border px-3 py-1 rounded-full font-medium">
          Playing as: <span className="font-bold">{currentUser.name}</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="soft-card rounded-2xl p-6 sm:p-8 border border-border space-y-3 to-teal-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-border flex items-center justify-center text-emerald-300">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Riddle Night Puzzles</h1>
            <p className="text-xs text-zinc-400">Mind teasers & romantic riddles to solve together</p>
          </div>
        </div>
      </div>

      {/* Riddles List */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {RIDDLES_DATA.map((riddle, idx) => {
          const solvedKey = `${riddle.id}_${currentUser.id}`;
          const isSolved = riddlesSolved[solvedKey] || revealedAnswers[riddle.id];
          const isHintOpen = openHintId === riddle.id;

          return (
            <div key={riddle.id} className="soft-card soft-card-hover rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-border">
                    Riddle #{idx + 1} • {riddle.category}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">{riddle.title}</h2>
                </div>

                {isSolved && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-border text-xs font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Solved</span>
                  </span>
                )}
              </div>

              {/* Question Box */}
              <div className="bg-zinc-950/90 p-4 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-200 leading-relaxed italic">
                "{riddle.question}"
              </div>

              {/* Hint Box */}
              {isHintOpen && (
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2 animate-in fade-in duration-200">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hint:</span> {riddle.hint}
                  </div>
                </div>
              )}

              {/* Solution Answer Box */}
              {isSolved && (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-border text-xs text-emerald-300 space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
                    <Key className="w-4 h-4" />
                    <span>Official Answer:</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{riddle.answer}</p>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setOpenHintId(isHintOpen ? null : riddle.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{isHintOpen ? 'Hide Hint' : 'Show Hint'}</span>
                </button>

                {!isSolved && (
                  <button
                    onClick={() => handleRevealAnswer(riddle.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md inline-flex items-center space-x-1.5 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Reveal Answer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
