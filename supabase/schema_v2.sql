-- Supabase Schema for Long Distance Relationship (LDR) MVP - V2 (Scalable Architecture)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Matches auth.uid()
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  couple_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COUPLES TABLE
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_one UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_two UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MEMORIES TABLE
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

-- 4. LOVE LETTERS TABLE
CREATE TABLE IF NOT EXISTS public.love_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  unlock_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MOODS TABLE
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BUCKET LIST TABLE
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

-- 7. COUNTDOWNS TABLE
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

-- 8. GAME INVITATIONS TABLE (NEW)
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

-- 9. GAME SESSIONS TABLE (UPDATED)
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

-- 10. GAME ANSWERS TABLE (UPDATED)
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

-- 11. NOTIFICATIONS TABLE (NEW)
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


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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


-- ==========================================
-- DATABASE TRIGGERS FOR NOTIFICATIONS
-- ==========================================

-- Helper to find partner's ID
CREATE OR REPLACE FUNCTION get_partner_id(user_uuid UUID, c_id UUID) RETURNS UUID AS $$
  SELECT CASE 
    WHEN partner_one = user_uuid THEN partner_two 
    ELSE partner_one 
  END
  FROM public.couples 
  WHERE id = c_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger: New Memory
CREATE OR REPLACE FUNCTION notify_new_memory() RETURNS TRIGGER AS $$
DECLARE
  partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  IF partner IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
    VALUES (partner, NEW.created_by, 'created', 'memory', NEW.id::text, jsonb_build_object('title', NEW.title));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_memory ON public.memories;
CREATE TRIGGER trigger_new_memory
  AFTER INSERT ON public.memories
  FOR EACH ROW EXECUTE FUNCTION notify_new_memory();

-- Trigger: New Love Letter
CREATE OR REPLACE FUNCTION notify_new_letter() RETURNS TRIGGER AS $$
DECLARE
  partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  IF partner IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
    VALUES (partner, NEW.created_by, 'created', 'letter', NEW.id::text, jsonb_build_object('title', NEW.title, 'is_locked', NEW.unlock_date IS NOT NULL));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_letter ON public.love_letters;
CREATE TRIGGER trigger_new_letter
  AFTER INSERT ON public.love_letters
  FOR EACH ROW EXECUTE FUNCTION notify_new_letter();

-- Trigger: New Game Invitation
CREATE OR REPLACE FUNCTION notify_new_game_invite() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
  VALUES (NEW.receiver_id, NEW.sender_id, 'invited', 'game_invitation', NEW.id::text, jsonb_build_object('game_type', NEW.game_type));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_game_invite ON public.game_invitations;
CREATE TRIGGER trigger_new_game_invite
  AFTER INSERT ON public.game_invitations
  FOR EACH ROW EXECUTE FUNCTION notify_new_game_invite();

-- ==========================================
-- GAME LIFECYCLE RPC FUNCTIONS
-- ==========================================

-- Accept Game Invitation
CREATE OR REPLACE FUNCTION accept_game_invitation(invite_id UUID) RETURNS UUID AS $$
DECLARE
  invite_row public.game_invitations%ROWTYPE;
  new_session_id UUID;
BEGIN
  -- Get the invite
  SELECT * INTO invite_row FROM public.game_invitations WHERE id = invite_id AND receiver_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or not pending';
  END IF;

  -- Create session
  INSERT INTO public.game_sessions (couple_id, game_type, status, subject_user_id, guesser_user_id)
  VALUES (invite_row.couple_id, invite_row.game_type, 'subject_playing', invite_row.sender_id, invite_row.receiver_id)
  RETURNING id INTO new_session_id;

  -- Update invite status
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
  -- Count total questions answered by both
  SELECT COUNT(*) INTO total_questions FROM public.game_answers WHERE session_id = session_uuid AND subject_answer IS NOT NULL AND guess_answer IS NOT NULL;
  
  -- Count matches
  SELECT COUNT(*) INTO match_count FROM public.game_answers WHERE session_id = session_uuid AND subject_answer = guess_answer;
  
  -- Calculate percentage
  IF total_questions > 0 THEN
    calc_score := (match_count * 100) / total_questions;
  ELSE
    calc_score := 0;
  END IF;

  -- Update session
  UPDATE public.game_sessions SET score = calc_score, status = 'completed' WHERE id = session_uuid;

  RETURN calc_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
