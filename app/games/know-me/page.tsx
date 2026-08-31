'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Clock, ArrowRight, Loader2, Trophy, Users } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useActiveGameSessions, 
  useGameAnswers, 
  useSessionQuestions, 
  useCreateGameRound, 
  useGameCategories, 
  useGameSessionSubscription,
  useSubmitGameAnswer,
  useAdvanceGameSession
} from '@/lib/queries/useGameSessions';
import { LiveCursors } from '@/components/live-cursors';
import { supabase } from '@/lib/supabase';

function KnowMeQuizContent() {
  const { currentUser, partner } = useLDRStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  // Activate realtime sync
  useGameSessionSubscription(sessionId);

  const { data: sessions = [], isLoading: sessionsLoading } = useActiveGameSessions();
  const session = sessions.find((s) => s.id === sessionId);

  const { data: dbAnswers = [], isLoading: answersLoading } = useGameAnswers(sessionId);
  const { data: sessionQuestions = [], isLoading: questionsLoading } = useSessionQuestions(sessionId);
  const { data: categories = [] } = useGameCategories('know-me');

  const createGameRound = useCreateGameRound();
  const submitGameAnswer = useSubmitGameAnswer();
  const advanceGameSession = useAdvanceGameSession();

  // Presence and Local State
  const [partnerPresence, setPartnerPresence] = useState<any>(null);
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  
  // Category selection presence
  const [playerSelections, setPlayerSelections] = useState<Record<string, string>>({});
  const presenceChannel = useRef<any>(null);

  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const channel = supabase.channel(`presence:game_session:${sessionId}`);
    presenceChannel.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerState = Object.values(state).flat().find((p: any) => p.user_id !== currentUser.id);
        setPartnerPresence(partnerState);
        
        // Extract category selections
        const selections: Record<string, string> = {};
        Object.values(state).flat().forEach((p: any) => {
          if (p.selectedCategory) {
            selections[p.user_id] = p.selectedCategory;
          }
        });
        setPlayerSelections(selections);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_id: currentUser.id, 
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUser?.id]);

  const currentQIndex = session?.current_question_index ?? 0;
  const currentQuestion = sessionQuestions[currentQIndex];

  // Helper to determine my role for the current question
  const isMyTurnToAnswer = currentQuestion?.subjectUserId === currentUser?.id;
  const isMyTurnToGuess = currentQuestion?.guesserUserId === currentUser?.id;
  const myRole = isMyTurnToAnswer ? 'subject' : 'guesser';

  const handleSelectOption = (option: string) => {
    setLocalAnswer(option);
    if (!session || !currentQuestion) return;

    submitGameAnswer.mutate({
      sessionId: session.id,
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answer: option,
      role: myRole
    });
  };

  const forceSubmitDefault = () => {
    if (!session || !currentQuestion || localAnswer) return;
    const defaultAnswer = currentQuestion.options?.[0] ?? 'Yes';
    handleSelectOption(defaultAnswer);
  };

  const handleAdvanceNext = () => {
    if (!session) return;
    advanceGameSession.mutate({
      sessionId: session.id,
      totalQuestions: sessionQuestions.length
    });
  };

  const handleProposeCategory = (categoryId: string) => {
    if (presenceChannel.current && currentUser) {
      presenceChannel.current.track({
        user_id: currentUser.id,
        selectedCategory: categoryId,
        online_at: new Date().toISOString(),
      });
    }
  };

  // Handle Question Timer
  useEffect(() => {
    if (!session || session.status !== 'playing' || !sessionQuestions.length) {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.current_question_index, session?.status, sessionQuestions.length, session]);

  // Update presence with locked status
  useEffect(() => {
    if (presenceChannel.current && currentUser) {
      presenceChannel.current.track({
        user_id: currentUser.id,
        online_at: new Date().toISOString(),
        locked_in: !!localAnswer,
      });
    }
  }, [localAnswer, currentUser]);

  if (!currentUser) return null;


  const renderCategorySelection = () => (
    <>
      <h2 className="text-xl font-bold text-white">Choose a Category</h2>
      <p className="text-sm text-zinc-400">Both of you must select the same category to start.</p>
      
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
      
      {playerSelections[currentUser.id] && playerSelections[currentUser.id] === playerSelections[partner?.id || ''] && (
        <div className="pt-4 border-t border-zinc-800 mt-6">
          <button
            onClick={() => createGameRound.mutate({ sessionId: session!.id, gameSlug: 'know-me', categoryId: playerSelections[currentUser.id] })}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center mx-auto"
            disabled={createGameRound.isPending}
          >
            {createGameRound.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Game'}
          </button>
        </div>
      )}
      {createGameRound.isPending && <p className="text-sm text-emerald-400 animate-pulse mt-4">Generating questions...</p>}
    </>
  );

  const dbAnswer = dbAnswers.find(a => a.question_id === currentQuestion?.id);
  const myDbAnswer = myRole === 'subject' ? dbAnswer?.subject_answer : dbAnswer?.guess_answer;
  const partnerDbAnswer = myRole === 'subject' ? dbAnswer?.guess_answer : dbAnswer?.subject_answer;
  
  const partnerLocked = partnerDbAnswer !== null && partnerDbAnswer !== undefined;
  const iLocked = localAnswer || (myDbAnswer !== null && myDbAnswer !== undefined);
  
  const bothLocked = iLocked && partnerLocked;
  const isMatch = bothLocked && dbAnswer?.subject_answer === dbAnswer?.guess_answer;

  const renderActiveQuestion = () => (
    <div className="soft-card rounded-2xl p-6 sm:p-8 border border-border space-y-6 relative overflow-hidden">
      
      {/* Top Progress Bar & Per-Question Live Clock */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{currentQuestion.categoryEmoji || '❓'}</span>
          <div>
            <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">
              Question {currentQIndex + 1} of {sessionQuestions.length}
            </span>
            <h3 className="text-xs text-zinc-400 font-medium">{currentQuestion.categoryName || 'General'}</h3>
          </div>
        </div>

        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-inner ${ timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-zinc-900 text-rose-300 border-border' }`}>
          <Clock className="w-4 h-4 text-rose-400" />
          <span>{timerSeconds}s</span>
        </div>
      </div>

      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((currentQIndex + 1) / sessionQuestions.length) * 100}%` }}
        />
      </div>

      <div className="py-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 mb-4">
          <Users className="w-3.5 h-3.5" />
          <span>{isMyTurnToAnswer ? 'Your turn to answer honestly.' : `Your turn to guess ${partner?.name?.split(' ')[0]}'s answer.`}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
          {currentQuestion.text}
        </h2>
      </div>

      {session?.status === 'playing' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options && currentQuestion.options.map((option, idx) => {
            const isMySelection = localAnswer === option || myDbAnswer === option;

            return (
              <button
                key={idx}
                onClick={() => !iLocked && handleSelectOption(option)}
                disabled={!!iLocked}
                className={`p-4 sm:p-5 rounded-xl border text-left text-sm font-semibold transition-all relative group ${ 
                  isMySelection ? 'bg-rose-500/30 border-rose-500 text-white ring-2 ring-rose-500 shadow-lg scale-[1.02]' 
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-border hover:bg-zinc-900 text-zinc-200' 
                } ${iLocked && !isMySelection ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isMySelection && <CheckCircle2 className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Partner Status or Result Reveal */}
      <div className="flex flex-col items-center justify-center pt-4 border-t border-zinc-800 mt-4 space-y-4">
        {session?.status === 'playing' ? (
          <div className="text-sm font-medium text-zinc-400">
            {!iLocked ? (
              <span>Pick your answer!</span>
            ) : !partnerLocked ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Waiting for {partner?.name} to lock in...</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Both locked in!</span>
            )}
          </div>
        ) : session?.status === 'revealing' ? (
          <div className="w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className={`inline-flex items-center justify-center space-x-2 px-6 py-2 rounded-full border text-lg font-black ${isMatch ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
              {isMatch ? '🎉 It’s a Match!' : '💔 Different Answers!'}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">{isMyTurnToAnswer ? 'Your Answer' : `${partner?.name}'s Answer`}</div>
                <div className="font-bold text-white">{dbAnswer?.subject_answer}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">{isMyTurnToGuess ? 'Your Guess' : `${partner?.name}'s Guess`}</div>
                <div className="font-bold text-white">{dbAnswer?.guess_answer}</div>
              </div>
            </div>

            {/* Only the subject user can click next to avoid double RPC calls */}
            {isMyTurnToAnswer ? (
              <button
                onClick={handleAdvanceNext}
                className="mx-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-black font-bold text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <span>{currentQIndex < sessionQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-zinc-500 animate-pulse">Waiting for {partner?.name} to advance...</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {sessionId && <LiveCursors channelName={`game_session:${sessionId}`} />}
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

      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-border">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Know Me Quiz — Live Sync</span>
        </div>
        <h1 className="text-3xl font-black text-white">How Well Do You Know Each Other?</h1>
      </div>

      {!sessionId ? (
        <div className="soft-card rounded-2xl p-8 border border-zinc-800 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">No Active Session Selected</h2>
          <Link href="/games" className="inline-block px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all">
            Return to Games Hub
          </Link>
        </div>
      ) : sessionsLoading || questionsLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      ) : session ? (
        <>
          {(session.status === 'subject_playing' || session.status === 'accepted') && sessionQuestions.length === 0 ? (
            <div className="soft-card rounded-2xl p-8 border border-border text-center space-y-4">
              {renderCategorySelection()}
            </div>
          ) : (session.status === 'playing' || session.status === 'revealing') && currentQuestion ? (
            renderActiveQuestion()
          ) : session.status === 'completed' ? (
            <div className="soft-card rounded-2xl p-8 border border-border text-center space-y-8 animate-in fade-in duration-300">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-border text-xs font-bold">
                <Trophy className="w-4 h-4 text-rose-400" />
                <span>Game Completed!</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                You scored {session.score}% match!
              </h2>
              <div className="flex justify-center pt-4">
                <Link
                  href="/games"
                  className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700 transition-all"
                >
                  Return to Games Hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="soft-card rounded-2xl p-8 border border-zinc-800 text-center">
              <h2 className="text-xl font-bold text-white">Loading next stage...</h2>
              <p className="text-sm text-zinc-400 mt-2">Status: {session.status}</p>
            </div>
          )}
        </>
      ) : (
        <div className="soft-card rounded-2xl p-8 border border-zinc-800 text-center">
          <h2 className="text-xl font-bold text-white">Session not found</h2>
        </div>
      )}
    </div>
  );
}

export default function KnowMeQuizPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      }
    >
      <KnowMeQuizContent />
    </React.Suspense>
  );
}

