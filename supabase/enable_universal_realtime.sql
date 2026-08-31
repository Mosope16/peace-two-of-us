-- ==========================================================
-- UNIVERSAL REALTIME & NOTIFICATION TRIGGERS FOR ALL TABLES
-- ==========================================================

-- 1. Ensure Table REPLICA IDENTITY is set to FULL (Ensures all column values are emitted on UPDATE / DELETE)
ALTER TABLE IF EXISTS public.couples REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.users REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.love_letters REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.countdowns REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.bucket_list REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.moods REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.game_invitations REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.game_answers REPLICA IDENTITY FULL;

-- 2. Add All Tables to supabase_realtime Publication
DO $$
BEGIN
  -- couples
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- users
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- love_letters
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.love_letters;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- countdowns
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.countdowns;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- bucket_list
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bucket_list;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- moods
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moods;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- notifications
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- game_invitations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- game_sessions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- game_answers
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_answers;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 3. Bucket List Notification Trigger (When partner adds or completes a bucket goal)
CREATE OR REPLACE FUNCTION notify_bucket_change() RETURNS TRIGGER AS $$
DECLARE
  partner UUID;
BEGIN
  partner := get_partner_id(NEW.created_by, NEW.couple_id);
  
  IF partner IS NOT NULL THEN
    IF (TG_OP = 'INSERT') THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
      VALUES (partner, NEW.created_by, 'created', 'bucket_list', NEW.id::text, jsonb_build_object('title', NEW.title, 'category', NEW.category));
    ELSIF (TG_OP = 'UPDATE' AND OLD.completed = false AND NEW.completed = true) THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, metadata)
      VALUES (partner, NEW.created_by, 'completed', 'bucket_list', NEW.id::text, jsonb_build_object('title', NEW.title));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bucket_change ON public.bucket_list;
CREATE TRIGGER trigger_bucket_change
  AFTER INSERT OR UPDATE ON public.bucket_list
  FOR EACH ROW
  EXECUTE FUNCTION notify_bucket_change();

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';

