-- ===================================================
-- COUNTDOWNS BACKEND CONFIGURATION & RLS POLICIES
-- ===================================================

-- 1. Ensure Extension Exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.countdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT DEFAULT 'visit',
  icon TEXT DEFAULT 'Calendar',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist in case the table already existed before
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'visit';
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Calendar';
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.countdowns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Index for fast query lookups
CREATE INDEX IF NOT EXISTS idx_countdowns_couple_target 
  ON public.countdowns(couple_id, target_date ASC);

-- 3. Enable Row Level Security
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Countdowns select policy" ON public.countdowns;
DROP POLICY IF EXISTS "Countdowns insert policy" ON public.countdowns;
DROP POLICY IF EXISTS "Countdowns update policy" ON public.countdowns;
DROP POLICY IF EXISTS "Countdowns delete policy" ON public.countdowns;

-- 5. Create Policies (Full access for couple members and authenticated users)
CREATE POLICY "Countdowns select policy" ON public.countdowns
  FOR SELECT USING (true);

CREATE POLICY "Countdowns insert policy" ON public.countdowns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Countdowns update policy" ON public.countdowns
  FOR UPDATE USING (true);

CREATE POLICY "Countdowns delete policy" ON public.countdowns
  FOR DELETE USING (true);

-- 6. Helper to find partner's ID (if not already defined)
CREATE OR REPLACE FUNCTION get_partner_id(user_uuid UUID, c_id UUID) RETURNS UUID AS $$
  SELECT CASE 
    WHEN partner_one = user_uuid THEN partner_two 
    ELSE partner_one 
  END
  FROM public.couples 
  WHERE id = c_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Trigger Function for New Countdown Notification to Partner
CREATE OR REPLACE FUNCTION notify_new_countdown() RETURNS TRIGGER AS $$
DECLARE
  partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  
  IF partner IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
    VALUES (
      partner, 
      NEW.created_by, 
      'created', 
      'countdown', 
      NEW.id::text, 
      jsonb_build_object('title', NEW.title, 'target_date', NEW.target_date, 'category', NEW.category)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Attach Notification Trigger
DROP TRIGGER IF EXISTS trigger_new_countdown ON public.countdowns;
CREATE TRIGGER trigger_new_countdown
  AFTER INSERT ON public.countdowns
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_countdown();

-- 9. Enable Supabase Realtime for countdowns
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.countdowns;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 10. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


