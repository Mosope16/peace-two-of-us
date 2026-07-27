'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Heart, Play, RotateCcw, Trophy, Flame } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { THIS_OR_THAT_QUESTIONS } from '@/lib/games-data';

export default function ThisOrThatGamePage() {
  const { currentUser, partner, couple } = useLDRStore();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [partnerChoice, setPartnerChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = THIS_OR_THAT_QUESTIONS[currentQIndex];
  const totalQuestions = THIS_OR_THAT_QUESTIONS.length;

  const handleSelect = (idx: number) => {
    setUserChoice(idx);
    // Simulated or synced partner choice
    const pChoice = Math.random() > 0.3 ? idx : (idx === 0 ? 1 : 0);
    setPartnerChoice(pChoice);

    if (idx === pChoice) {
      setScore((prev) => prev + 10);
    }
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
    setScore(0);
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

        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Score: {score} pts</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-rose-500/30 relative overflow-hidden shadow-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-rose-950/20 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>This or That &bull; Match Answers</span>
        </div>

        {!isFinished ? (
          <>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Question {currentQIndex + 1} of {totalQuestions}</span>
                <span>{Math.round(((currentQIndex + 1) / totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
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
                    className={`p-6 rounded-2xl border text-lg font-bold transition-all flex flex-col items-center justify-center space-y-2 shadow-lg ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-white ring-2 ring-rose-500'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-rose-500/50 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Reveal Result Card */}
            {userChoice !== null && (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-rose-500/40 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-center space-x-6 text-sm font-semibold">
                  <div className="text-center">
                    <span className="text-zinc-400 text-xs block">Your Pick</span>
                    <span className="text-rose-300 font-bold">{currentQ.options[userChoice]}</span>
                  </div>
                  <div className="text-2xl">⚡</div>
                  <div className="text-center">
                    <span className="text-zinc-400 text-xs block">{partner?.name || 'Partner'}'s Pick</span>
                    <span className="text-pink-300 font-bold">
                      {partnerChoice !== null ? currentQ.options[partnerChoice] : 'Thinking...'}
                    </span>
                  </div>
                </div>

                {partnerChoice !== null && (
                  <div className="pt-2">
                    {userChoice === partnerChoice ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-extrabold flex items-center justify-center space-x-2">
                        <span>🎉 PERFECT MATCH! (+10 pts)</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-extrabold flex items-center justify-center space-x-2">
                        <span>😄 Different vibes! Opposites attract!</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-rose-500/25 transition-all"
                >
                  {currentQIndex < totalQuestions - 1 ? 'Next Question →' : 'See Final Results 🏆'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Final Results Screen */
          <div className="space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/30">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">This or That Completed! 🎉</h2>
              <p className="text-zinc-300 text-sm">
                You &amp; {partner?.name || 'Partner'} scored <span className="text-rose-400 font-bold">{score} / {totalQuestions * 10} points</span> on matching choices!
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={restartGame}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg"
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
