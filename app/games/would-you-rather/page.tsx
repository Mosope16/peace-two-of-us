'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, RotateCcw, Trophy } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { WOULD_YOU_RATHER_QUESTIONS } from '@/lib/games-data';

export default function WouldYouRatherPage() {
  const { partner } = useLDRStore();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [partnerChoice, setPartnerChoice] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = WOULD_YOU_RATHER_QUESTIONS[currentQIndex];
  const totalQuestions = WOULD_YOU_RATHER_QUESTIONS.length;

  const handleSelect = (idx: number) => {
    setUserChoice(idx);
    const pChoice = Math.random() > 0.5 ? idx : (idx === 0 ? 1 : 0);
    setPartnerChoice(pChoice);
  };

  const handleNext = () => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setUserChoice(null);
      setPartnerChoice(null);
    } else {
      setIsFinished(true);
    }
  };

  const restartGame = () => {
    setCurrentQIndex(0);
    setUserChoice(null);
    setPartnerChoice(null);
    setIsFinished(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="soft-card rounded-3xl p-6 sm:p-10 border border-border relative overflow-hidden text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-border text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Would You Rather &bull; Couple Scenarios</span>
        </div>

        {!isFinished ? (
          <>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Scenario {currentQIndex + 1} of {totalQuestions}</span>
                <span>{Math.round(((currentQIndex + 1) / totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {currentQ.question}
            </h2>

            {/* Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userChoice === idx;
                return (
                  <button
                    key={idx}
                    disabled={userChoice !== null}
                    onClick={() => handleSelect(idx)}
                    className={`p-6 rounded-2xl border text-lg font-bold transition-all flex flex-col items-center justify-center space-y-2 shadow-lg ${ isSelected ? 'bg-purple-500/20 border-purple-500 text-white ring-2 ring-purple-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-border hover:bg-zinc-800' }`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Reveal Result Card */}
            {userChoice !== null && (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-border space-y-4 animate-fadeIn">
                <div className="flex items-center justify-center space-x-6 text-sm font-semibold">
                  <div className="text-center">
                    <span className="text-zinc-400 text-xs block">Your Answer</span>
                    <span className="text-purple-300 font-bold">{currentQ.options[userChoice]}</span>
                  </div>
                  <div className="text-2xl">💞</div>
                  <div className="text-center">
                    <span className="text-zinc-400 text-xs block">{partner?.name || 'Partner'}'s Answer</span>
                    <span className="text-pink-300 font-bold">
                      {partnerChoice !== null ? currentQ.options[partnerChoice] : 'Thinking...'}
                    </span>
                  </div>
                </div>

                {partnerChoice !== null && (
                  <div className="pt-2">
                    {userChoice === partnerChoice ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-border text-emerald-300 text-sm font-extrabold">
                        <span>✨ You both chose the exact same scenario!</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-border text-rose-300 text-sm font-extrabold">
                        <span>💬 Fun topic to chat about on your next call!</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  {currentQIndex < totalQuestions - 1 ? 'Next Scenario →' : 'Finish Game 🏆'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Final Results Screen */
          <div className="space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-white shadow-xl shadow-purple-500/30">
              <Heart className="w-10 h-10 fill-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Would You Rather Completed! 🎉</h2>
              <p className="text-zinc-300 text-sm">
                You've completed all scenarios with {partner?.name || 'Partner'}. Great conversations ahead!
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={restartGame}
                className="px-6 py-3.5 rounded-xl text-white font-bold text-xs flex items-center space-x-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <Link
                href="/games"
                className="px-6 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-xs hover:text-white"
              >
                More Games
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
