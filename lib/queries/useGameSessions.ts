import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLDRStore } from '@/lib/store';

export type GameSession = {
  id: string;
  couple_id: string;
  game_type: string;
  status: 'pending' | 'accepted' | 'subject_playing' | 'waiting_for_guesser' | 'guessing' | 'completed' | 'cancelled' | 'expired';
  subject_user_id: string;
  guesser_user_id: string;
  subject_completed: boolean;
  guesser_completed: boolean;
  score: number;
  created_at: string;
};

export function useActiveGameSessions() {
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useQuery({
    queryKey: ['game_sessions', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('couple_id', coupleId)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .neq('status', 'expired')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GameSession[];
    },
    enabled: !!coupleId,
  });
}

export type GameAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  question_text: string;
  subject_answer: string | null;
  guess_answer: string | null;
  is_correct: boolean | null;
  created_at: string;
};

export function useGameAnswers(sessionId: string | null) {
  return useQuery({
    queryKey: ['game_answers', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('game_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as GameAnswer[];
    },
    enabled: !!sessionId,
  });
}

export function useSubmitSubjectAnswers() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async ({ sessionId, answers }: { sessionId: string; answers: { question_id: string; question_text: string; subject_answer: string }[] }) => {
      // 1. Insert answers
      const answersData = answers.map(a => ({
        session_id: sessionId,
        question_id: a.question_id,
        question_text: a.question_text,
        subject_answer: a.subject_answer
      }));

      const { error: answersError } = await supabase
        .from('game_answers')
        .insert(answersData);

      if (answersError) throw answersError;

      // 2. Update session status
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'waiting_for_guesser',
          subject_completed: true 
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      return sessionId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_sessions', coupleId] });
    }
  });
}

export function useSubmitGuesserAnswers() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async ({ sessionId, answers }: { sessionId: string; answers: { question_id: string; guess_answer: string }[] }) => {
      // 1. Update each answer
      // Since we can't easily bulk update different rows with different values in standard Supabase JS without RPC,
      // we'll do it sequentially or with Promise.all
      const updatePromises = answers.map(a => 
        supabase
          .from('game_answers')
          .update({ guess_answer: a.guess_answer })
          .eq('session_id', sessionId)
          .eq('question_id', a.question_id)
      );

      await Promise.all(updatePromises);

      // 2. Update session status
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'guessing', // or completed if we immediately calculate
          guesser_completed: true 
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      return sessionId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_sessions', coupleId] });
    }
  });
}

export function useCalculateGameScore() {
  const queryClient = useQueryClient();
  const coupleId = useLDRStore((state) => state.couple?.id);

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.rpc('calculate_game_score', { session_uuid: sessionId });
      if (error) throw error;
      return data as number;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game_sessions', coupleId] });
    }
  });
}

export type SessionQuestion = {
  id: string;
  text: string;
  options: string[] | null;
  answerType: string;
  categoryName?: string;
  categoryEmoji?: string;
};

type SessionQuestionAssignmentRow = {
  question_id: string;
  questions: {
    id: string;
    question_text: string;
    options: string[] | null;
    answer_type: string;
    game_categories: {
      name: string | null;
      emoji: string | null;
    } | null;
  } | null;
};

export function useGameCategories(gameSlug: string) {
  return useQuery({
    queryKey: ['game_categories', gameSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_categories')
        .select('*')
        .eq('game_id', (await supabase.from('games').select('id').eq('slug', gameSlug).single()).data?.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!gameSlug,
  });
}

export function useSessionQuestions(sessionId: string | null) {
  return useQuery({
    queryKey: ['session_questions', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('session_question_assignments')
        .select(`
          question_id,
          questions (
            id,
            question_text,
            options,
            answer_type,
            game_categories (
              name,
              emoji
            )
          )
        `)
        .eq('session_id', sessionId)
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      return (data as unknown as SessionQuestionAssignmentRow[]).flatMap((assignment) => {
        const question = assignment.questions;

        if (!question) return [];

        return [{
          id: question.id,
          text: question.question_text,
          options: question.options,
          answerType: question.answer_type,
          categoryName: question.game_categories?.name ?? undefined,
          categoryEmoji: question.game_categories?.emoji ?? undefined,
        }];
      }) as SessionQuestion[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateGameRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, gameSlug, categoryId }: { sessionId: string; gameSlug: string; categoryId?: string }) => {
      const { data, error } = await supabase.rpc('create_game_round', {
        p_session_id: sessionId,
        p_game_slug: gameSlug,
        p_category_id: categoryId || null
      });

      if (error) throw error;

      return (data as unknown as Array<{
        id: string;
        text: string;
        options: string[] | null;
        answerType: string;
        categoryName?: string | null;
        categoryEmoji?: string | null;
      }>) as SessionQuestion[];
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session_questions', variables.sessionId] });
    }
  });
}
