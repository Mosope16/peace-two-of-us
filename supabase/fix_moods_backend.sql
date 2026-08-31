-- ===================================================
-- MOODS BACKEND CONFIGURATION & REALTIME SETUP
-- ===================================================

-- 1. Ensure Extension Exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Table & Columns Exist
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist in case the table was created before
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Index for fast mood query lookups
CREATE INDEX IF NOT EXISTS idx_moods_user_created 
  ON public.moods(user_id, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Moods select policy" ON public.moods;
DROP POLICY IF EXISTS "Moods insert policy" ON public.moods;
DROP POLICY IF EXISTS "Moods update policy" ON public.moods;
DROP POLICY IF EXISTS "Moods delete policy" ON public.moods;

-- 5. Create Policies (Full access for couple members and authenticated users)
CREATE POLICY "Moods select policy" ON public.moods
  FOR SELECT USING (true);

CREATE POLICY "Moods insert policy" ON public.moods
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Moods update policy" ON public.moods
  FOR UPDATE USING (true);

CREATE POLICY "Moods delete policy" ON public.moods
  FOR DELETE USING (true);

-- 6. Helper to find partner's ID (if not already defined)
CREATE OR REPLACE FUNCTION get_user_couple_id(user_uuid UUID) RETURNS UUID AS $$
  SELECT couple_id FROM public.users WHERE id = user_uuid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Trigger Function for Partner Mood Notification
CREATE OR REPLACE FUNCTION notify_new_mood() RETURNS TRIGGER AS $$
DECLARE
  c_id UUID;
  partner UUID;
BEGIN
  c_id := get_user_couple_id(NEW.user_id);
  
  IF c_id IS NOT NULL THEN
    partner := get_partner_id(NEW.user_id, c_id);
    
    IF partner IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
      VALUES (
        partner, 
        NEW.user_id, 
        'updated', 
        'mood', 
        NEW.id::text, 
        jsonb_build_object('mood', NEW.mood, 'note', NEW.note)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Attach Notification Trigger
DROP TRIGGER IF EXISTS trigger_new_mood ON public.moods;
CREATE TRIGGER trigger_new_mood
  AFTER INSERT ON public.moods
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_mood();

-- 9. Enable Supabase Realtime for moods table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.moods;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 10. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

