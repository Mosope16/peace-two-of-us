'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Clock, Lock, Sparkles, Trophy, CheckCircle2, Zap, Crown, Eye, RefreshCcw } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { IQ_DUEL_CLASSIC_QUESTIONS, IQ_DUEL_MARATHON_QUESTIONS, shuffleArray } from '@/lib/games-data';
import { IQDuelQuestion } from '@/types';

type DuelMode = 'classic' | 'marathon';

export default function IQDuelPage() {
  const { currentUser, partner, iqDuelAnswers, saveIQDuelAnswer, resetIQDuelMatch } = useLDRStore();
  const [activeMode, setActiveMode] = useState<DuelMode>('classic');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerLeft, setTimerLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);

  const rawQuestions: IQDuelQuestion[] = activeMode === 'classic' ? IQ_DUEL_CLASSIC_QUESTIONS : IQ_DUEL_MARATHON_QUESTIONS;
  const [questions, setQuestions] = useState<IQDuelQuestion[]>(rawQuestions);

  useEffect(() => {
    const base = activeMode === 'classic' ? IQ_DUEL_CLASSIC_QUESTIONS : IQ_DUEL_MARATHON_QUESTIONS;
    setQuestions(shuffleArray(base));
  }, [activeMode]);

  const matchId = `match-iq-${activeMode}`;
  const currentQuestion = questions[currentQuestionIndex] || questions[0] || rawQuestions[0];

  const currentAnswersMap = iqDuelAnswers[matchId] || {};
  const myAnswerKey = `${currentUser.id}_${currentQuestion.id}`;
  const myCurrentAnswer = currentAnswersMap[myAnswerKey];

  const partnerAnswerKey = `${partner?.id || ''}_${currentQuestion.id}`;
  const partnerCurrentAnswer = currentAnswersMap[partnerAnswerKey];

  // Per-question countdown timer
  useEffect(() => {
    if (isGameOver) return;
    setTimerLeft(currentQuestion.timeSeconds);

    const interval = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, activeMode, isGameOver]);

  const handleSelectOption = (index: number) => {
    if (isGameOver) return;
    const timeSpent = currentQuestion.timeSeconds - timerLeft;
    saveIQDuelAnswer(matchId, currentQuestion.id, index, timeSpent);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsGameOver(true);
    }
  };

  // Compute final scores for Grand Reveal
  let myScore = 0;
  let partnerScore = 0;
  let myCorrectCount = 0;
  let partnerCorrectCount = 0;

  questions.forEach((q) => {
    const mAns = currentAnswersMap[`${currentUser.id}_${q.id}`];
    const pAns = currentAnswersMap[`${partner?.id || ''}_${q.id}`];
    const points = q.isDoublePoints ? 200 : 100;

    if (mAns && mAns.selected_index === q.correctIndex) {
      myScore += points;
      myCorrectCount += 1;
    }
    if (pAns && pAns.selected_index === q.correctIndex) {
      partnerScore += points;
      partnerCorrectCount += 1;
    }
  });

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

        <div className="text-xs text-purple-400 bg-purple-500/10 border border-border px-3 py-1 rounded-full font-medium">
          Playing as: <span className="font-bold">{currentUser.name}</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="soft-card rounded-2xl p-6 border border-border space-y-4 to-indigo-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-border flex items-center justify-center text-purple-300">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">IQ Duel Battle</h1>
            <p className="text-xs text-zinc-400">Competitive intelligence & trivia duel for couples</p>
          </div>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              setActiveMode('classic');
              setCurrentQuestionIndex(0);
              setIsGameOver(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ activeMode === 'classic' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' }`}
          >
            ⚡ Classic Mode (12 Qs • 10m)
          </button>
          <button
            onClick={() => {
              setActiveMode('marathon');
              setCurrentQuestionIndex(0);
              setIsGameOver(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ activeMode === 'marathon' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' }`}
          >
            🔥 Marathon Mode (20 Qs • 18m)
          </button>
        </div>
      </div>

      {/* Duel Features Rules Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center space-x-2 text-zinc-300">
          <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>🔒 Answer Privately (No Peek)</span>
        </div>
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center space-x-2 text-zinc-300">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>⏱️ Per-Question Timers</span>
        </div>
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center space-x-2 text-zinc-300">
          <Eye className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>🤫 End-Game Reveal</span>
        </div>
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center space-x-2 text-zinc-300">
          <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>👑 Final Q = 2x Points</span>
        </div>
      </div>

      {/* Main Game Interface */}
      {!isGameOver ? (
        <div className="soft-card rounded-2xl p-6 sm:p-8 border border-border space-y-6">
          {/* Question Header & Clock */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                {currentQuestion.isDoublePoints && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center space-x-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Double Points (2x)</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{currentQuestion.question}</h2>
            </div>

            {/* Per-Question Clock */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-inner self-start sm:self-auto ${ timerLeft <= 5 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-zinc-900 text-purple-300 border-border' }`}>
              <Clock className="w-4 h-4" />
              <span>{timerLeft}s</span>
            </div>
          </div>

          {/* Partner Private Lock-In Status Pill */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>
                {partner?.name.split(' ')[0]}'s Status: {' '}
                {partnerCurrentAnswer ? (
                  <span className="text-emerald-400 font-bold">🔒 Locked in secretly!</span>
                ) : (
                  <span className="text-zinc-500">Thinking...</span>
                )}
              </span>
            </div>

            {myCurrentAnswer && (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your Answer Locked</span>
              </span>
            )}
          </div>

          {/* Question Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelectedByMe = myCurrentAnswer?.selected_index === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all relative ${ isSelectedByMe ? 'bg-purple-500/20 border-purple-500 text-white ring-2 ring-purple-500 shadow-lg' : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-300' }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isSelectedByMe && <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Next Question →
              </button>
            ) : (
              <button
                onClick={() => setIsGameOver(true)}
                className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs shadow-lg transition-all"
              >
                👑 Submit Duel & Reveal Results!
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Grand End-Game Reveal Screen */
        <div className="soft-card rounded-2xl p-8 border border-border text-center space-y-8 to-zinc-950">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🤫 Grand Reveal — Final Scoreboard</span>
          </div>

          <h2 className="text-4xl font-black text-white">
            {myScore > partnerScore ? '🏆 You Won the Duel!' : myScore < partnerScore ? `👑 ${partner?.name.split(' ')[0]} Won the Duel!` : '🤝 It is a Tied Battle!'}
          </h2>

          {/* Scores Comparison Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-border space-y-2">
              <img src={currentUser.avatar} className="w-12 h-12 rounded-full mx-auto object-cover ring-2 ring-purple-500/50" />
              <h3 className="font-bold text-white text-sm">{currentUser.name}</h3>
              <p className="text-3xl font-black text-purple-400">{myScore} pts</p>
              <p className="text-[11px] text-zinc-400">{myCorrectCount} / {questions.length} Correct</p>
            </div>

            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-border space-y-2">
              <img src={partner?.avatar} className="w-12 h-12 rounded-full mx-auto object-cover ring-2 ring-pink-500/50" />
              <h3 className="font-bold text-white text-sm">{partner?.name}</h3>
              <p className="text-3xl font-black text-pink-400">{partnerScore} pts</p>
              <p className="text-[11px] text-zinc-400">{partnerCorrectCount} / {questions.length} Correct</p>
            </div>
          </div>

          {/* Detailed Question Answers Breakdown */}
          <div className="space-y-4 text-left max-w-2xl mx-auto pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-center">Full Question Breakdown</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const mAns = currentAnswersMap[`${currentUser.id}_${q.id}`];
                const pAns = currentAnswersMap[`${partner?.id || ''}_${q.id}`];
                const correctOpt = q.options[q.correctIndex];

                return (
                  <div key={q.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">Q{idx + 1}: {q.question}</span>
                      {q.isDoublePoints && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">2x Points</span>}
                    </div>

                    <div className="text-emerald-400 font-semibold">
                      Correct Answer: <span className="text-white">{correctOpt}</span>
                    </div>

                    <div className="flex justify-between pt-1 text-[11px] text-zinc-400 border-t border-zinc-900">
                      <span>
                        Your choice: <strong className={mAns?.selected_index === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'}>
                          {mAns !== undefined ? q.options[mAns.selected_index] : 'No answer'}
                        </strong>
                      </span>
                      <span>
                        {partner?.name.split(' ')[0]}'s choice: <strong className={pAns?.selected_index === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'}>
                          {pAns !== undefined ? q.options[pAns.selected_index] : 'No answer'}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              resetIQDuelMatch(matchId);
              setCurrentQuestionIndex(0);
              setIsGameOver(false);
            }}
            className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-lg inline-flex items-center space-x-2 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Play Rematch</span>
          </button>
        </div>
      )}
    </div>
  );
}
