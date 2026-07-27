'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Heart, Clock, Play, RotateCcw, Flame, Shuffle, Trophy, ArrowRight } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { QUIZ_CATEGORIES, KNOW_ME_QUESTIONS, shuffleArray } from '@/lib/games-data';
import { QuizCategoryId, KnowMeQuestion } from '@/types';

export default function KnowMeQuizPage() {
  const { currentUser, partner, quizAnswers, answerQuizQuestion } = useLDRStore();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategoryId>('long_distance');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [questionsList, setQuestionsList] = useState<KnowMeQuestion[]>([]);

  const categoryInfo = QUIZ_CATEGORIES.find((c) => c.id === selectedCategory) || QUIZ_CATEGORIES[0];

  // Start/restart quiz round with shuffled questions
  const startQuizRound = (category: QuizCategoryId = selectedCategory) => {
    const rawCategoryQuestions = KNOW_ME_QUESTIONS.filter((q) => q.category === category);
    const shuffled = shuffleArray(rawCategoryQuestions);
    setQuestionsList(shuffled);
    setSelectedCategory(category);
    setCurrentQIndex(0);
    setTimerSeconds(60);
    setIsQuizActive(true);
    setIsRoundFinished(false);
  };

  // Per-Question 1-Minute (60 Seconds) Countdown Timer
  useEffect(() => {
    if (!isQuizActive || isRoundFinished) return;

    setTimerSeconds(60); // Reset timer to 60s for the current question

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Time expired for this question -> Move to next question or finish
          if (currentQIndex < questionsList.length - 1) {
            setCurrentQIndex((idx) => idx + 1);
          } else {
            setIsRoundFinished(true);
            setIsQuizActive(false);
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isQuizActive, isRoundFinished, currentQIndex]);

  // Handle Option Selection -> Lock in & Auto-Advance to Next Question
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    answerQuizQuestion(questionId, optionIndex);

    // Auto-advance to next question with fresh timer
    setTimeout(() => {
      if (currentQIndex < questionsList.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        // Finished all questions in category!
        setIsRoundFinished(true);
        setIsQuizActive(false);
      }
    }, 250);
  };

  const currentQuestion = questionsList[currentQIndex];

  // Calculate Match Score for Summary Screen
  let totalAnsweredBoth = 0;
  let totalMatchedCount = 0;

  questionsList.forEach((q) => {
    const answersObj = quizAnswers[q.id] || {};
    const myAns = answersObj[currentUser.id];
    const partnerAns = answersObj[partner?.id || ''];

    if (myAns !== undefined && partnerAns !== undefined) {
      totalAnsweredBoth += 1;
      if (myAns === partnerAns) totalMatchedCount += 1;
    }
  });

  const matchPercentage = totalAnsweredBoth > 0 ? Math.round((totalMatchedCount / totalAnsweredBoth) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games Hub</span>
        </Link>

        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full font-medium">
          Playing as: <span className="font-bold">{currentUser.name}</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Know Me Quiz — 1 Minute Per Question</span>
        </div>
        <h1 className="text-3xl font-black text-white">How Well Do You Know Each Other?</h1>
        <p className="text-xs text-zinc-400">
          Each question has a 1-minute timer • Select an answer to auto-advance to the next question!
        </p>
      </div>

      {/* 17 Category Selector Grid (Shown when not mid-quiz) */}
      {!isQuizActive && !isRoundFinished && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pick Category &amp; Start Quiz</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {QUIZ_CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategory;
              const count = KNOW_ME_QUESTIONS.filter((q) => q.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? `${cat.badgeBg} ring-2 ring-rose-500 shadow-lg scale-105`
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.emoji}</span>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : cat.color}`}>
                      {cat.title}
                    </span>
                    {cat.is18Plus && <span className="text-[9px] px-1 bg-red-600 text-white font-extrabold rounded">18+</span>}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">{count} Questions</span>
                </button>
              );
            })}
          </div>

          {/* Start Quiz Card */}
          <div className="glass-card rounded-2xl p-6 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-pink-950/40">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{categoryInfo.emoji}</span>
              <div>
                <h3 className="text-lg font-bold text-white">{categoryInfo.title} Quiz</h3>
                <p className="text-xs text-zinc-400">⏱️ 1 Minute per question • Auto-advances when answered</p>
              </div>
            </div>

            <button
              onClick={() => startQuizRound(selectedCategory)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* MID-QUIZ: ONE QUESTION AT A TIME WITH 1-MINUTE PER-QUESTION TIMER */}
      {isQuizActive && currentQuestion && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-rose-500/30 space-y-6 relative overflow-hidden">
          
          {/* Top Progress Bar & Per-Question 1-Minute Live Clock */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{categoryInfo.emoji}</span>
              <div>
                <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">
                  Question {currentQIndex + 1} of {questionsList.length}
                </span>
                <h3 className="text-xs text-zinc-400 font-medium">{categoryInfo.title}</h3>
              </div>
            </div>

            {/* Per-Question 60s Live Countdown Clock */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-inner ${
              timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-zinc-900 text-rose-300 border-rose-500/30'
            }`}>
              <Clock className="w-4 h-4 text-rose-400" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / questionsList.length) * 100}%` }}
            />
          </div>

          {/* Current Question Text */}
          <div className="py-2">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options Grid — Clicking One Locks Choice & Auto Advances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const answersObj = quizAnswers[currentQuestion.id] || {};
              const isMySelection = answersObj[currentUser.id] === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion.id, idx)}
                  className={`p-4 sm:p-5 rounded-xl border text-left text-sm font-semibold transition-all relative group ${
                    isMySelection
                      ? 'bg-rose-500/30 border-rose-500 text-white ring-2 ring-rose-500 shadow-lg scale-[1.02]'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-900 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isMySelection && <CheckCircle2 className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              ← Previous Question
            </button>

            <button
              onClick={() => {
                if (currentQIndex < questionsList.length - 1) {
                  setCurrentQIndex((prev) => prev + 1);
                } else {
                  setIsRoundFinished(true);
                  setIsQuizActive(false);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs transition-all flex items-center space-x-1"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* QUIZ FINISHED / SUMMARY RESULTS SCREEN */}
      {isRoundFinished && (
        <div className="glass-card rounded-2xl p-8 border border-rose-500/40 text-center space-y-8 bg-gradient-to-b from-rose-950/30 via-zinc-900 to-zinc-950 shadow-2xl animate-in fade-in duration-300">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
            <Trophy className="w-4 h-4 text-rose-400" />
            <span>Quiz Category Completed!</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {totalAnsweredBoth > 0 ? `${matchPercentage}% Match with ${partner?.name.split(' ')[0]} ❤️` : 'Answers Locked In!'}
          </h2>

          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            You finished the <span className="text-rose-300 font-bold">{categoryInfo.title}</span> quiz category. Switch to {partner?.name.split(' ')[0]}'s profile in the top menu to complete their answers and calculate your final match score!
          </p>

          {/* Detailed Question Answers Comparison */}
          <div className="space-y-4 text-left max-w-2xl mx-auto pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-center">Question Answers Breakdown</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {questionsList.map((q, idx) => {
                const answersObj = quizAnswers[q.id] || {};
                const myAns = answersObj[currentUser.id];
                const partnerAns = answersObj[partner?.id || ''];
                const isMatch = myAns !== undefined && partnerAns !== undefined && myAns === partnerAns;

                return (
                  <div key={q.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">Q{idx + 1}: {q.question}</span>
                      {myAns !== undefined && partnerAns !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isMatch ? 'Match!' : 'Different'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-zinc-900">
                      <div>
                        <span className="text-zinc-400 block">Your Answer:</span>
                        <strong className="text-white">
                          {myAns !== undefined ? q.options[myAns] : 'Not answered'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">{partner?.name.split(' ')[0]}'s Answer:</span>
                        <strong className="text-pink-300">
                          {partnerAns !== undefined ? q.options[partnerAns] : 'Waiting for partner...'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => startQuizRound(selectedCategory)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg inline-flex items-center justify-center space-x-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Category</span>
            </button>

            <button
              onClick={() => {
                setIsRoundFinished(false);
                setIsQuizActive(false);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700 inline-flex items-center justify-center space-x-2 transition-all"
            >
              <span>Try Another Category</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
