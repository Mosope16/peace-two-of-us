'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Heart, Clock, Play, RotateCcw, Flame, Shuffle, Trophy, ArrowRight, Loader2, Users } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGameSessions, useSubmitSubjectAnswers, useSubmitGuesserAnswers, useCalculateGameScore, useGameAnswers, useSessionQuestions, useCreateGameRound, useGameCategories, SessionQuestion } from '@/lib/queries/useGameSessions';
import { LiveCursors } from '@/components/live-cursors';
import { supabase } from '@/lib/supabase';

export default function KnowMeQuizPage() {
  const { currentUser, partner } = useLDRStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session');

  const { data: sessions = [], isLoading: sessionsLoading } = useActiveGameSessions();
  const session = sessions.find((s) => s.id === sessionId);

  const { data: dbAnswers = [], isLoading: answersLoading } = useGameAnswers(sessionId);
  const { data: sessionQuestions = [], isLoading: questionsLoading } = useSessionQuestions(sessionId);
  const { data: categories = [] } = useGameCategories('know-me');
  const createGameRound = useCreateGameRound();
  
  const submitSubjectAnswers = useSubmitSubjectAnswers();
  const submitGuesserAnswers = useSubmitGuesserAnswers();
  const calculateScore = useCalculateGameScore();

  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  
  // Local state for answers being collected during active play
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [questionsList, setQuestionsList] = useState<SessionQuestion[]>([]);
  const roundRequestKeyRef = useRef<string | null>(null);

  // Synced state for category selection
  const [playerSelections, setPlayerSelections] = useState<Record<string, string>>({});

  // Sync category selections via Broadcast
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const channel = supabase.channel(`game_session:${sessionId}`);
    
    channel.on('broadcast', { event: 'propose_category' }, ({ payload }) => {
      setPlayerSelections(prev => ({ ...prev, [payload.userId]: payload.categoryId }));
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUser]);

  const handleProposeCategory = (categoryId: string) => {
    if (!sessionId || !currentUser) return;
    setPlayerSelections(prev => ({ ...prev, [currentUser.id]: categoryId }));
    supabase.channel(`game_session:${sessionId}`).send({
      type: 'broadcast',
      event: 'propose_category',
      payload: { userId: currentUser.id, categoryId }
    });
  };

  // Invalidate session questions when session status changes (e.g. from subject_playing to waiting_for_guesser)
  useEffect(() => {
    if (session?.status && session.id) {
      queryClient.invalidateQueries({ queryKey: ['session_questions', session.id] });
    }
  }, [session?.status, session?.id, queryClient]);

  // Automatically start quiz if session is active and we have questions
  useEffect(() => {
    if (!session || isQuizActive || isRoundFinished || !sessionId) return;

    if (session.status === 'subject_playing' && session.subject_user_id === currentUser.id) {
      if (sessionQuestions.length > 0) {
        setQuestionsList(sessionQuestions);
        setIsQuizActive(true);
        setCurrentQIndex(0);
        setTimerSeconds(60);
      }
    } else if (session.status === 'waiting_for_guesser' && session.guesser_user_id === currentUser.id) {
      if (sessionQuestions.length > 0) {
        setQuestionsList(sessionQuestions);
        setIsQuizActive(true);
        setCurrentQIndex(0);
        setTimerSeconds(60);
      }
    }
  }, [session, isQuizActive, isRoundFinished, currentUser.id, sessionQuestions, sessionId]);

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
    const question = questionsList.find(q => q.id === questionId);
    if (!question) return;

    const answerText = question.options ? question.options[optionIndex] : 'Yes';
    setLocalAnswers(prev => ({ ...prev, [questionId]: answerText }));

    // Auto-advance to next question with fresh timer
    setTimeout(() => {
      if (currentQIndex < questionsList.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        // Finished all questions! Submit them.
        finishQuiz(answerText);
      }
    }, 250);
  };

  const finishQuiz = async (lastAnswer: string) => {
    setIsQuizActive(false);
    setIsRoundFinished(true);

    if (!session || !sessionId) return;

    try {
      if (session.subject_user_id === currentUser.id) {
        const payload = questionsList.map(q => ({
          question_id: q.id,
          question_text: q.text,
          subject_answer: q.id === currentQuestion.id ? lastAnswer : (localAnswers[q.id] || (q.options ? q.options[0] : 'Yes'))
        }));
        await submitSubjectAnswers.mutateAsync({ sessionId, answers: payload });
      } else if (session.guesser_user_id === currentUser.id) {
        const payload = questionsList.map(q => ({
          question_id: q.id,
          guess_answer: q.id === currentQuestion.id ? lastAnswer : (localAnswers[q.id] || (q.options ? q.options[0] : 'Yes'))
        }));
        await submitGuesserAnswers.mutateAsync({ sessionId, answers: payload });
        await calculateScore.mutateAsync(sessionId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentQuestion = questionsList[currentQIndex];

  return (
    <div className="space-y-8 pb-12">
      {sessionId && <LiveCursors channelName={`game_session:${sessionId}`} />}
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games Hub</span>
        </Link>

        <div className="text-xs text-rose-400 bg-rose-500/10 border border-border px-3 py-1 rounded-full font-medium">
          Playing as: <span className="font-bold">{currentUser.name}</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-border">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Know Me Quiz — 1 Minute Per Question</span>
        </div>
        <h1 className="text-3xl font-black text-white">How Well Do You Know Each Other?</h1>
        <p className="text-xs text-zinc-400">
          Each question has a 1-minute timer • Select an answer to auto-advance to the next question!
        </p>
      </div>

      {/* Session Selection / Waiting State */}
      {!isQuizActive && !isRoundFinished && (
        <div className="space-y-4">
          {!sessionId ? (
            <div className="soft-card rounded-2xl p-8 border border-zinc-800 text-center space-y-4">
              <h2 className="text-xl font-bold text-white">No Active Session Selected</h2>
              <p className="text-sm text-zinc-400">Please go back to the Games Hub to invite your partner or join an active game.</p>
              <Link href="/games" className="inline-block px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all">
                Return to Games Hub
              </Link>
            </div>
          ) : sessionsLoading || answersLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
          ) : session ? (
            <div className="soft-card rounded-2xl p-8 border border-border text-center space-y-4">
              {session.status === 'subject_playing' && sessionQuestions.length === 0 ? (
                <>
                  <h2 className="text-xl font-bold text-white">Choose a Category</h2>
                  <p className="text-sm text-zinc-400">Both of you must select the same category to start.</p>
                  
                  {/* Status Indicator */}
                  <div className="mt-2 text-xs font-medium">
                    {playerSelections[currentUser.id] && playerSelections[partner?.id || ''] ? (
                      playerSelections[currentUser.id] === playerSelections[partner?.id || ''] ? (
                        <span className="text-emerald-400 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Category Agreed!</span>
                      ) : (
                        <span className="text-amber-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Waiting to agree...</span>
                      )
                    ) : (
                      <span className="text-zinc-500">Waiting for selections...</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button 
                      onClick={() => handleProposeCategory('random')}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${playerSelections[currentUser.id] === 'random' ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'}`}
                      disabled={createGameRound.isPending}
                    >
                      <span className="text-xl mr-2 group-hover:scale-110 inline-block transition-transform">🎲</span> 
                      <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">Random Mix</span>
                      
                      {/* Avatars for Random Mix */}
                      <div className="absolute top-2 right-2 flex -space-x-1">
                        {playerSelections[currentUser.id] === 'random' && (
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-zinc-900 z-10" title="You">
                            {currentUser.name.charAt(0)}
                          </div>
                        )}
                        {playerSelections[partner?.id || ''] === 'random' && (
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-zinc-900 z-0" title={partner?.name}>
                            {partner?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </button>
                    {categories.map(cat => {
                      const isMeSelected = playerSelections[currentUser.id] === cat.id;
                      const isPartnerSelected = playerSelections[partner?.id || ''] === cat.id;
                      
                      return (
                      <button 
                        key={cat.id}
                        onClick={() => handleProposeCategory(cat.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${isMeSelected ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'}`}
                        disabled={createGameRound.isPending}
                      >
                        <span className="text-xl mr-2 group-hover:scale-110 inline-block transition-transform">{cat.emoji}</span> 
                        <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">{cat.name}</span>
                        
                        {/* Avatars */}
                        <div className="absolute top-2 right-2 flex -space-x-1">
                          {isMeSelected && (
                            <div className="w-6 h-6 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-zinc-900 z-10" title="You">
                              {currentUser.name.charAt(0)}
                            </div>
                          )}
                          {isPartnerSelected && (
                            <div className="w-6 h-6 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-zinc-900 z-0" title={partner?.name}>
                              {partner?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                      </button>
                    )})}
                  </div>
                  
                  {/* Start Game Button (only visible when agreed) */}
                  {playerSelections[currentUser.id] && playerSelections[currentUser.id] === playerSelections[partner?.id || ''] && (
                    <div className="pt-4 border-t border-zinc-800 mt-6">
                      <button
                        onClick={() => createGameRound.mutate({ sessionId: session.id, gameSlug: 'know-me', categoryId: playerSelections[currentUser.id] === 'random' ? undefined : playerSelections[currentUser.id] })}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center mx-auto"
                        disabled={createGameRound.isPending}
                      >
                        {createGameRound.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Game'}
                      </button>
                    </div>
                  )}
                  {createGameRound.isPending && <p className="text-sm text-emerald-400 animate-pulse mt-4">Generating questions...</p>}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">
                    {session.status === 'completed' ? 'Game Completed!' : 'Waiting for Partner'}
                  </h2>
              <p className="text-sm text-zinc-400">
                {session.status === 'subject_playing' && session.guesser_user_id === currentUser.id && `${partner?.name.split(' ')[0]} is currently answering questions...`}
                {session.status === 'waiting_for_guesser' && session.subject_user_id === currentUser.id && `${partner?.name.split(' ')[0]} is currently guessing your answers...`}
                {session.status === 'guessing' && `Calculating score...`}
                {session.status === 'completed' && `You scored ${session.score}% match!`}
              </p>
              
              {session.status === 'completed' && (
                <div className="mt-6 text-left max-w-2xl mx-auto border-t border-zinc-800 pt-6">
                  <h3 className="text-sm font-bold text-white mb-4">Answers Breakdown</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {dbAnswers.map((a, idx) => {
                      const isMatch = a.subject_answer === a.guess_answer;
                      return (
                        <div key={a.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-300">Q{idx + 1}: {a.question_text}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ isMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300' }`}>
                              {isMatch ? 'Match!' : 'Different'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-zinc-900">
                            <div>
                              <span className="text-zinc-400 block">{session.subject_user_id === currentUser.id ? 'Your Answer' : `${partner?.name.split(' ')[0]}'s Answer`}:</span>
                              <strong className="text-white">{a.subject_answer}</strong>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">{session.guesser_user_id === currentUser.id ? 'Your Guess' : `${partner?.name.split(' ')[0]}'s Guess`}:</span>
                              <strong className="text-pink-300">{a.guess_answer}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          ) : (
            <div className="soft-card rounded-2xl p-8 border border-zinc-800 text-center">
              <h2 className="text-xl font-bold text-white">Session not found</h2>
            </div>
          )}
        </div>
      )}

      {/* MID-QUIZ: ONE QUESTION AT A TIME WITH 1-MINUTE PER-QUESTION TIMER */}
      {isQuizActive && currentQuestion && (
        <div className="soft-card rounded-2xl p-6 sm:p-8 border border-border space-y-6 relative overflow-hidden">
          
          {/* Top Progress Bar & Per-Question 1-Minute Live Clock */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{currentQuestion.categoryEmoji || '❓'}</span>
              <div>
                <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">
                  Question {currentQIndex + 1} of {questionsList.length}
                </span>
                <h3 className="text-xs text-zinc-400 font-medium">{currentQuestion.categoryName || 'General'}</h3>
              </div>
            </div>

            {/* Per-Question 60s Live Countdown Clock */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-inner ${ timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-zinc-900 text-rose-300 border-border' }`}>
              <Clock className="w-4 h-4 text-rose-400" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / questionsList.length) * 100}%` }}
            />
          </div>

          {/* Current Question Text */}
          <div className="py-2">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Options Grid — Clicking One Locks Choice & Auto Advances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options && currentQuestion.options.map((option, idx) => {
              const isMySelection = localAnswers[currentQuestion.id] === option;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion.id, idx)}
                  className={`p-4 sm:p-5 rounded-xl border text-left text-sm font-semibold transition-all relative group ${ isMySelection ? 'bg-rose-500/30 border-rose-500 text-white ring-2 ring-rose-500 shadow-lg scale-[1.02]' : 'bg-zinc-950/80 border-zinc-800 hover:border-border hover:bg-zinc-900 text-zinc-200' }`}
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
                  const fallbackAnswer = currentQuestion.options?.[0] ?? 'Yes';
                  finishQuiz(localAnswers[currentQuestion.id] || fallbackAnswer);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs transition-all flex items-center space-x-1"
            >
              <span>{currentQIndex < questionsList.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* QUIZ FINISHED / SUMMARY RESULTS SCREEN */}
      {isRoundFinished && (
        <div className="soft-card rounded-2xl p-8 border border-border text-center space-y-8 animate-in fade-in duration-300">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-border text-xs font-bold">
            <Trophy className="w-4 h-4 text-rose-400" />
            <span>Turn Completed!</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Answers Submitted
          </h2>

          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Your answers have been recorded. Waiting for the final calculation...
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setIsRoundFinished(false);
                setIsQuizActive(false);
                router.push('/games');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700 inline-flex items-center justify-center space-x-2 transition-all"
            >
              <span>Return to Games Hub</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
