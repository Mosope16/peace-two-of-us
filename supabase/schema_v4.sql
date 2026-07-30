-- schema_v4.sql
-- Synchronous Gameplay Migration

-- 1. Update game_sessions
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS current_question_index INT DEFAULT 0;

-- 2. Update session_question_assignments
ALTER TABLE public.session_question_assignments
ADD COLUMN IF NOT EXISTS subject_user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS guesser_user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS question_order INT DEFAULT 0;

-- 3. Add UNIQUE constraint to game_answers to support UPSERT
ALTER TABLE public.game_answers
DROP CONSTRAINT IF EXISTS game_answers_session_question_key;

ALTER TABLE public.game_answers
ADD CONSTRAINT game_answers_session_question_key UNIQUE (session_id, question_id);

-- 4. Create submit_game_answer RPC
CREATE OR REPLACE FUNCTION public.submit_game_answer(
  p_session_id UUID,
  p_question_id TEXT,
  p_question_text TEXT,
  p_answer TEXT,
  p_role TEXT -- 'subject' or 'guesser'
)
RETURNS JSON AS $$
DECLARE
  v_game_answer RECORD;
  v_both_answered BOOLEAN := false;
  v_is_match BOOLEAN := false;
BEGIN
  -- Upsert the answer
  IF p_role = 'subject' THEN
    INSERT INTO public.game_answers (session_id, question_id, question_text, subject_answer)
    VALUES (p_session_id, p_question_id, p_question_text, p_answer)
    ON CONFLICT (session_id, question_id) 
    DO UPDATE SET subject_answer = EXCLUDED.subject_answer;
  ELSIF p_role = 'guesser' THEN
    INSERT INTO public.game_answers (session_id, question_id, question_text, guess_answer)
    VALUES (p_session_id, p_question_id, p_question_text, p_answer)
    ON CONFLICT (session_id, question_id) 
    DO UPDATE SET guess_answer = EXCLUDED.guess_answer;
  ELSE
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Check if both answered
  SELECT * INTO v_game_answer
  FROM public.game_answers
  WHERE session_id = p_session_id AND question_id = p_question_id;

  IF v_game_answer.subject_answer IS NOT NULL AND v_game_answer.guess_answer IS NOT NULL THEN
    v_both_answered := true;
    
    -- Check if it's a match
    IF v_game_answer.subject_answer = v_game_answer.guess_answer THEN
      v_is_match := true;
    END IF;

    -- Update the record with is_correct
    UPDATE public.game_answers
    SET is_correct = v_is_match
    WHERE id = v_game_answer.id;

    -- Update session status to revealing
    UPDATE public.game_sessions
    SET status = 'revealing'
    WHERE id = p_session_id;
  END IF;

  RETURN json_build_object(
    'both_answered', v_both_answered,
    'is_match', v_is_match
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create advance_game_session RPC
CREATE OR REPLACE FUNCTION public.advance_game_session(
  p_session_id UUID,
  p_total_questions INT
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_new_index INT;
  v_new_status TEXT;
  v_score INT := 0;
BEGIN
  -- Get current session
  SELECT * INTO v_session
  FROM public.game_sessions
  WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  v_new_index := v_session.current_question_index + 1;

  IF v_new_index >= p_total_questions THEN
    -- Game over, calculate score
    SELECT count(*) INTO v_score
    FROM public.game_answers
    WHERE session_id = p_session_id AND is_correct = true;

    UPDATE public.game_sessions
    SET 
      status = 'completed',
      score = v_score,
      subject_completed = true,
      guesser_completed = true
    WHERE id = p_session_id;

    v_new_status := 'completed';
  ELSE
    -- Move to next question
    UPDATE public.game_sessions
    SET 
      current_question_index = v_new_index,
      status = 'playing'
    WHERE id = p_session_id;

    v_new_status := 'playing';
  END IF;

  RETURN json_build_object(
    'status', v_new_status,
    'current_question_index', v_new_index,
    'score', v_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
