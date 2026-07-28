-- Consolidated Supabase Schema for TwoOfUs LDR MVP
-- Includes: Core Tables, Real-time Features, and Backend-Driven Game Architecture

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Matches auth.uid()
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  couple_id UUID, -- This must exist for the get_user_couple_id function below
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_one UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_two UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FEATURE TABLES
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.love_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  unlock_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'travel',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.countdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT DEFAULT 'visit',
  icon TEXT DEFAULT 'Heart',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'created', 'invited', etc.
  entity_type TEXT NOT NULL, -- 'memory', 'letter', 'game_invitation', 'mood'
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. GAMES ARCHITECTURE TABLES
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  questions_per_round INT DEFAULT 5,
  time_limit_seconds INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, accepted, declined, expired
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, accepted, subject_playing, waiting_for_guesser, guessing, completed, cancelled, expired
  subject_user_id UUID REFERENCES public.users(id),
  guesser_user_id UUID REFERENCES public.users(id),
  subject_completed BOOLEAN DEFAULT false,
  guesser_completed BOOLEAN DEFAULT false,
  score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.game_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  subject_answer TEXT,
  guess_answer TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.session_question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.couple_question_stats (
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  times_used INT DEFAULT 1,
  PRIMARY KEY (couple_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Can be null for cooperative games
  score INT,
  duration_seconds INT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure couple_id exists on users (Fix for Error 42703)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='couple_id') THEN
        ALTER TABLE public.users ADD COLUMN couple_id UUID;
    END IF;
END $$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Helper function to get a user's couple_id
CREATE OR REPLACE FUNCTION get_user_couple_id() RETURNS UUID AS $$
  SELECT couple_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS: Can read anyone in their couple, but can only update themselves
DROP POLICY IF EXISTS "Users can view their partner" ON public.users;
CREATE POLICY "Users can view their partner" ON public.users FOR SELECT USING (
  id = auth.uid() OR couple_id = get_user_couple_id()
);
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
CREATE POLICY "Users can update themselves" ON public.users FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
CREATE POLICY "Users can insert themselves" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- COUPLES: Can read/update if they belong to it
DROP POLICY IF EXISTS "Couples read access" ON public.couples;
CREATE POLICY "Couples read access" ON public.couples FOR SELECT USING (
  partner_one = auth.uid() OR partner_two = auth.uid()
);
DROP POLICY IF EXISTS "Couples insert access" ON public.couples;
CREATE POLICY "Couples insert access" ON public.couples FOR INSERT WITH CHECK (
  partner_one = auth.uid() OR partner_two = auth.uid()
);
DROP POLICY IF EXISTS "Couples update access" ON public.couples;
CREATE POLICY "Couples update access" ON public.couples FOR UPDATE USING (
  partner_one = auth.uid() OR partner_two = auth.uid()
);

-- MEMORIES: Couple-scoped access
DROP POLICY IF EXISTS "Memories read access" ON public.memories;
CREATE POLICY "Memories read access" ON public.memories FOR SELECT USING (couple_id = get_user_couple_id());
DROP POLICY IF EXISTS "Memories insert access" ON public.memories;
CREATE POLICY "Memories insert access" ON public.memories FOR INSERT WITH CHECK (couple_id = get_user_couple_id() AND created_by = auth.uid());
DROP POLICY IF EXISTS "Memories delete access" ON public.memories;
CREATE POLICY "Memories delete access" ON public.memories FOR DELETE USING (couple_id = get_user_couple_id());

-- LOVE LETTERS: Couple-scoped access
DROP POLICY IF EXISTS "Letters read access" ON public.love_letters;
CREATE POLICY "Letters read access" ON public.love_letters FOR SELECT USING (couple_id = get_user_couple_id());
DROP POLICY IF EXISTS "Letters insert access" ON public.love_letters;
CREATE POLICY "Letters insert access" ON public.love_letters FOR INSERT WITH CHECK (couple_id = get_user_couple_id() AND created_by = auth.uid());

-- MOODS: User-scoped insert, Partner-scoped read
DROP POLICY IF EXISTS "Moods read access" ON public.moods;
CREATE POLICY "Moods read access" ON public.moods FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE couple_id = get_user_couple_id())
);
DROP POLICY IF EXISTS "Moods insert access" ON public.moods;
CREATE POLICY "Moods insert access" ON public.moods FOR INSERT WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS: User can only read their own
DROP POLICY IF EXISTS "Notifications read access" ON public.notifications;
CREATE POLICY "Notifications read access" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
DROP POLICY IF EXISTS "Notifications update access" ON public.notifications;
CREATE POLICY "Notifications update access" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());

-- GAMES DATA: Publicly readable
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON public.game_categories FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);

-- GAME SESSIONS & ANSWERS: Couple-scoped access
DROP POLICY IF EXISTS "Couples can view assignments for their sessions" ON public.session_question_assignments;
CREATE POLICY "Couples can view assignments for their sessions" ON public.session_question_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.game_sessions gs WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id())
);

DROP POLICY IF EXISTS "Couples can view their own question stats" ON public.couple_question_stats;
CREATE POLICY "Couples can view their own question stats" ON public.couple_question_stats FOR SELECT USING (
  couple_id = get_user_couple_id()
);

DROP POLICY IF EXISTS "Couples can view their game results" ON public.game_results;
CREATE POLICY "Couples can view their game results" ON public.game_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.game_sessions gs WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id())
);

-- GAME INVITATIONS: Couple-scoped access
DROP POLICY IF EXISTS "Couples can view invitations" ON public.game_invitations;
CREATE POLICY "Couples can view invitations" ON public.game_invitations FOR SELECT USING (couple_id = get_user_couple_id());

DROP POLICY IF EXISTS "Couples can insert invitations" ON public.game_invitations;
CREATE POLICY "Couples can insert invitations" ON public.game_invitations FOR INSERT WITH CHECK (couple_id = get_user_couple_id() AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Couples can update invitations" ON public.game_invitations;
CREATE POLICY "Couples can update invitations" ON public.game_invitations FOR UPDATE USING (couple_id = get_user_couple_id());

-- GAME SESSIONS: Couple-scoped access
DROP POLICY IF EXISTS "Couples can view their sessions" ON public.game_sessions;
CREATE POLICY "Couples can view their sessions" ON public.game_sessions FOR SELECT USING (couple_id = get_user_couple_id());

DROP POLICY IF EXISTS "Couples can update their sessions" ON public.game_sessions;
CREATE POLICY "Couples can update their sessions" ON public.game_sessions FOR UPDATE USING (couple_id = get_user_couple_id());

DROP POLICY IF EXISTS "Couples can insert their sessions" ON public.game_sessions;
CREATE POLICY "Couples can insert their sessions" ON public.game_sessions FOR INSERT WITH CHECK (couple_id = get_user_couple_id());

-- GAME ANSWERS: Couple-scoped access
DROP POLICY IF EXISTS "Couples can view their answers" ON public.game_answers;
CREATE POLICY "Couples can view their answers" ON public.game_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.game_sessions gs WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id())
);

DROP POLICY IF EXISTS "Couples can insert their answers" ON public.game_answers;
CREATE POLICY "Couples can insert their answers" ON public.game_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_sessions gs WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id())
);

DROP POLICY IF EXISTS "Couples can update their answers" ON public.game_answers;
CREATE POLICY "Couples can update their answers" ON public.game_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.game_sessions gs WHERE gs.id = session_id AND gs.couple_id = get_user_couple_id())
);

-- 6. TRIGGERS & NOTIFICATION LOGIC
-- Helper to find partner's ID
CREATE OR REPLACE FUNCTION get_partner_id(user_uuid UUID, c_id UUID) RETURNS UUID AS $$
  SELECT CASE
    WHEN partner_one = user_uuid THEN partner_two
    ELSE partner_one
  END
  FROM public.couples
  WHERE id = c_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger Functions
CREATE OR REPLACE FUNCTION notify_new_memory() RETURNS TRIGGER AS $$
DECLARE partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  IF partner IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
    VALUES (partner, NEW.created_by, 'created', 'memory', NEW.id::text, jsonb_build_object('title', NEW.title));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_new_letter() RETURNS TRIGGER AS $$
DECLARE partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  IF partner IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
    VALUES (partner, NEW.created_by, 'created', 'letter', NEW.id::text, jsonb_build_object('title', NEW.title, 'is_locked', NEW.unlock_date IS NOT NULL));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_new_game_invite() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
  VALUES (NEW.receiver_id, NEW.sender_id, 'invited', 'game_invitation', NEW.id::text, jsonb_build_object('game_type', NEW.game_type));
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers
DROP TRIGGER IF EXISTS trigger_new_memory ON public.memories;
CREATE TRIGGER trigger_new_memory AFTER INSERT ON public.memories FOR EACH ROW EXECUTE FUNCTION notify_new_memory();

DROP TRIGGER IF EXISTS trigger_new_letter ON public.love_letters;
CREATE TRIGGER trigger_new_letter AFTER INSERT ON public.love_letters FOR EACH ROW EXECUTE FUNCTION notify_new_letter();

DROP TRIGGER IF EXISTS trigger_new_game_invite ON public.game_invitations;
CREATE TRIGGER trigger_new_game_invite AFTER INSERT ON public.game_invitations FOR EACH ROW EXECUTE FUNCTION notify_new_game_invite();

-- 7. RPC FUNCTIONS (GAME LIFECYCLE)

-- Create Game Round (Backend Question Picker)
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
  SELECT couple_id INTO v_couple_id FROM game_sessions WHERE id = p_session_id;
  IF v_couple_id IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;

  SELECT questions_per_round INTO v_limit FROM games WHERE slug = p_game_slug;
  IF v_limit IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;

  WITH candidate_questions AS (
    SELECT
      q.id, q.question_text AS "text", q.options, q.answer_type AS "answerType", q.correct_index AS "correctIndex",
      cat.name AS "categoryName", cat.emoji AS "categoryEmoji",
      COALESCE(cqs.last_used_at, '1970-01-01'::timestamp) as used_at
    FROM questions q
    LEFT JOIN game_categories cat ON q.category_id = cat.id
    LEFT JOIN couple_question_stats cqs ON q.id = cqs.question_id AND cqs.couple_id = v_couple_id
    WHERE q.is_active = true AND q.status = 'approved'
      AND q.game_id = (SELECT id FROM games WHERE slug = p_game_slug)
      AND (p_category_id IS NULL OR q.category_id = p_category_id)
    ORDER BY used_at ASC, (random() * q.weight) DESC
    LIMIT v_limit
  )
  SELECT COALESCE(json_agg(row_to_json(candidate_questions)), '[]'::json), COALESCE(array_agg(id), ARRAY[]::UUID[])
  INTO v_questions, v_question_ids FROM candidate_questions;

  IF array_length(v_question_ids, 1) > 0 THEN
    INSERT INTO session_question_assignments (session_id, question_id) SELECT p_session_id, unnest(v_question_ids);
    INSERT INTO couple_question_stats (couple_id, question_id, last_used_at, times_used)
    SELECT v_couple_id, unnest(v_question_ids), now(), 1
    ON CONFLICT (couple_id, question_id) DO UPDATE SET last_used_at = now(), times_used = couple_question_stats.times_used + 1;
  END IF;

  RETURN v_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept Game Invitation
CREATE OR REPLACE FUNCTION accept_game_invitation(invite_id UUID) RETURNS UUID AS $$
DECLARE
  invite_row public.game_invitations%ROWTYPE;
  new_session_id UUID;
BEGIN
  SELECT * INTO invite_row FROM public.game_invitations WHERE id = invite_id AND receiver_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found or not pending'; END IF;

  INSERT INTO public.game_sessions (couple_id, game_type, status, subject_user_id, guesser_user_id)
  VALUES (invite_row.couple_id, invite_row.game_type, 'subject_playing', invite_row.sender_id, invite_row.receiver_id)
  RETURNING id INTO new_session_id;

  UPDATE public.game_invitations SET status = 'accepted' WHERE id = invite_id;
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Match Score
CREATE OR REPLACE FUNCTION calculate_game_score(session_uuid UUID) RETURNS INT AS $$
DECLARE
  match_count INT;
  total_questions INT;
  calc_score INT;
BEGIN
  SELECT COUNT(*) INTO total_questions FROM public.game_answers WHERE session_id = session_uuid AND subject_answer IS NOT NULL AND guess_answer IS NOT NULL;
  SELECT COUNT(*) INTO match_count FROM public.game_answers WHERE session_id = session_uuid AND subject_answer = guess_answer;

  IF total_questions > 0 THEN calc_score := (match_count * 100) / total_questions;
  ELSE calc_score := 0; END IF;

  UPDATE public.game_sessions SET score = calc_score, status = 'completed' WHERE id = session_uuid;
  RETURN calc_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
