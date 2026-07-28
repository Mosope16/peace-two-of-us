-- schema_v3.sql: Backend-Driven Games Architecture

-- 1. Games Table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  questions_per_round INT DEFAULT 5,
  time_limit_seconds INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Game Categories Table
CREATE TABLE IF NOT EXISTS public.game_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  color TEXT,
  badge_bg TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.game_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_type TEXT DEFAULT 'multiple_choice', -- 'text', 'multiple_choice', 'this_or_that', 'yes_no', 'rating', 'emoji'
  options JSONB, -- stores array of options or other config
  correct_index INT,
  difficulty TEXT DEFAULT 'medium',
  weight INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_adult BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'approved', -- 'draft', 'approved', 'archived'
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Session Question Assignments Table
CREATE TABLE IF NOT EXISTS public.session_question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Couple Question Stats Table
CREATE TABLE IF NOT EXISTS public.couple_question_stats (
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  times_used INT DEFAULT 1,
  PRIMARY KEY (couple_id, question_id)
);

-- 6. Game Results Table
CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Can be null for cooperative games
  score INT,
  duration_seconds INT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON public.game_categories FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);

-- Couples can view assignments for their sessions
CREATE POLICY "Couples can view assignments for their sessions" ON public.session_question_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_sessions gs 
    WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id()
  )
);

-- Couples can view their own question stats
CREATE POLICY "Couples can view their own question stats" ON public.couple_question_stats FOR SELECT USING (
  couple_id = get_user_couple_id()
);

-- Couples can view game results for their sessions
CREATE POLICY "Couples can view their game results" ON public.game_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_sessions gs 
    WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id()
  )
);

-- 7. RPC for Round Creation
CREATE OR REPLACE FUNCTION create_game_round(
  p_session_id UUID,
  p_game_slug TEXT,
  p_category_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_couple_id UUID;
  v_questions JSON;
  v_question_ids UUID[];
  v_limit INT;
BEGIN
  -- 1. Ensure this is inside a transaction implicitly by plpgsql, but we can rely on Postgres handling function calls as single transactions.
  
  -- Get couple id from session
  SELECT couple_id INTO v_couple_id 
  FROM game_sessions 
  WHERE id = p_session_id;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or invalid';
  END IF;

  -- Get limit from game settings
  SELECT questions_per_round INTO v_limit 
  FROM games 
  WHERE slug = p_game_slug;

  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- 2. Select Candidate Questions
  WITH candidate_questions AS (
    SELECT 
      q.id, 
      q.question_text AS "text", 
      q.options, 
      q.answer_type AS "answerType",
      q.correct_index AS "correctIndex",
      cat.name AS "categoryName",
      cat.emoji AS "categoryEmoji",
      COALESCE(cqs.last_used_at, '1970-01-01'::timestamp) as used_at
    FROM questions q
    LEFT JOIN game_categories cat ON q.category_id = cat.id
    LEFT JOIN couple_question_stats cqs
      ON q.id = cqs.question_id AND cqs.couple_id = v_couple_id
    WHERE q.is_active = true 
      AND q.status = 'approved'
      AND q.game_id = (SELECT id FROM games WHERE slug = p_game_slug)
      AND (p_category_id IS NULL OR q.category_id = p_category_id)
    ORDER BY 
      used_at ASC,     -- Oldest or never used first
      (random() * q.weight) DESC -- Randomize ties, weighting higher weight questions slightly more if we want (simplified)
    LIMIT v_limit
  )
  SELECT 
    COALESCE(json_agg(row_to_json(candidate_questions)), '[]'::json), 
    COALESCE(array_agg(id), ARRAY[]::UUID[])
  INTO v_questions, v_question_ids
  FROM candidate_questions;
  
  -- 3. Assign questions to session & update stats
  IF array_length(v_question_ids, 1) > 0 THEN
    -- Assign
    INSERT INTO session_question_assignments (session_id, question_id)
    SELECT p_session_id, unnest(v_question_ids);
    
    -- Update Stats
    INSERT INTO couple_question_stats (couple_id, question_id, last_used_at, times_used)
    SELECT v_couple_id, unnest(v_question_ids), now(), 1
    ON CONFLICT (couple_id, question_id) 
    DO UPDATE SET 
      last_used_at = now(), 
      times_used = couple_question_stats.times_used + 1;
  END IF;

  -- 4. Return lightweight JSON payload
  RETURN v_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
