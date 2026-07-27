'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, RotateCcw, Award } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { COMPATIBILITY_QUESTIONS } from '@/lib/games-data';

export default function CompatibilityQuizPage() {
  const { partner } = useLDRStore();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = COMPATIBILITY_QUESTIONS[currentQIndex];
  const totalQuestions = COMPATIBILITY_QUESTIONS.length;

  const handleSelectOption = (idx: number) => {
    const nextUser = [...userAnswers, idx];
    const nextPartner = [...partnerAnswers, Math.random() > 0.3 ? idx : (idx + 1) % currentQ.options.length];
    
    setUserAnswers(nextUser);
    setPartnerAnswers(nextPartner);

    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateCompatibility = () => {
    if (userAnswers.length === 0) return { percent: 100, matches: 0, differences: 0 };
    let matches = 0;
    userAnswers.forEach((ans, i) => {
      if (ans === partnerAnswers[i]) matches++;
    });
    const percent = Math.round((matches / userAnswers.length) * 100);
    return { percent, matches, differences: userAnswers.length - matches };
  };

  const restartQuiz = () => {
    setCurrentQIndex(0);
    setUserAnswers([]);
    setPartnerAnswers([]);
    setIsFinished(false);
  };

  const { percent, matches, differences } = calculateCompatibility();

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
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-rose-500/30 relative overflow-hidden shadow-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-pink-950/20 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Couple Compatibility Quiz &bull; Deep Insights</span>
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
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {currentQ.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-rose-500/20 hover:border-rose-500/50 text-zinc-200 text-sm font-semibold transition-all text-left flex items-center justify-between group"
                >
                  <span>{opt}</span>
                  <span className="text-xs text-zinc-500 group-hover:text-rose-300">Select →</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Final Compatibility Breakdown */
          <div className="space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/30 text-3xl font-black">
              {percent}%
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Compatibility Score</h2>
              <p className="text-zinc-300 text-sm">
                You &amp; {partner?.name || 'Partner'} have an outstanding relationship harmony!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="text-2xl font-black text-emerald-400 block">{matches}</span>
                <span className="text-xs text-zinc-400 font-semibold">Things You Agree On</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-2xl font-black text-amber-400 block">{differences}</span>
                <span className="text-xs text-zinc-400 font-semibold">Things You Differ On</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <button
                onClick={restartQuiz}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
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
