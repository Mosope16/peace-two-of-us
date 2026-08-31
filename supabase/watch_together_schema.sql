-- ==============================================================================
-- PEACE WATCH TOGETHER SCHEMA & REALTIME ENGINE (FIXED RLS & NOTIFICATIONS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WATCH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL DEFAULT 'youtube' CHECK (media_type IN ('youtube')),
    media_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('created', 'active', 'ended')),
    current_position NUMERIC NOT NULL DEFAULT 0,
    is_playing BOOLEAN NOT NULL DEFAULT false,
    last_action_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ
);

-- 3. WATCH CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.watch_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watch_session_id UUID NOT NULL REFERENCES public.watch_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_watch_sessions_couple_status ON public.watch_sessions(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_watch_messages_session ON public.watch_messages(watch_session_id, created_at ASC);

-- 5. REPLICA IDENTITY FOR REALTIME
ALTER TABLE public.watch_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.watch_messages REPLICA IDENTITY FULL;

-- 6. REALTIME PUBLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'watch_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'watch_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_messages;
    END IF;
END $$;

-- 7. ENABLE ROW LEVEL SECURITY (RLS) WITH CLERK-COMPATIBLE POLICIES
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_messages ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if any
DROP POLICY IF EXISTS "Couples can manage their watch sessions" ON public.watch_sessions;
DROP POLICY IF EXISTS "Watch sessions select policy" ON public.watch_sessions;
DROP POLICY IF EXISTS "Watch sessions insert policy" ON public.watch_sessions;
DROP POLICY IF EXISTS "Watch sessions update policy" ON public.watch_sessions;
DROP POLICY IF EXISTS "Watch sessions delete policy" ON public.watch_sessions;

DROP POLICY IF EXISTS "Couples can manage watch messages" ON public.watch_messages;
DROP POLICY IF EXISTS "Watch messages select policy" ON public.watch_messages;
DROP POLICY IF EXISTS "Watch messages insert policy" ON public.watch_messages;
DROP POLICY IF EXISTS "Watch messages update policy" ON public.watch_messages;
DROP POLICY IF EXISTS "Watch messages delete policy" ON public.watch_messages;

-- Create open RLS policies (Clerk handles authentication at the application level)
CREATE POLICY "Watch sessions select policy" ON public.watch_sessions FOR SELECT USING (true);
CREATE POLICY "Watch sessions insert policy" ON public.watch_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Watch sessions update policy" ON public.watch_sessions FOR UPDATE USING (true);
CREATE POLICY "Watch sessions delete policy" ON public.watch_sessions FOR DELETE USING (true);

CREATE POLICY "Watch messages select policy" ON public.watch_messages FOR SELECT USING (true);
CREATE POLICY "Watch messages insert policy" ON public.watch_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Watch messages update policy" ON public.watch_messages FOR UPDATE USING (true);
CREATE POLICY "Watch messages delete policy" ON public.watch_messages FOR DELETE USING (true);

-- 8. HELPER FUNCTION TO GET PARTNER ID
CREATE OR REPLACE FUNCTION get_partner_id(user_uuid UUID, c_id UUID) RETURNS UUID AS $$
  SELECT CASE 
    WHEN partner_one = user_uuid THEN partner_two 
    ELSE partner_one 
  END
  FROM public.couples 
  WHERE id = c_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. NOTIFY PARTNER WHEN WATCH SESSION STARTS
CREATE OR REPLACE FUNCTION notify_partner_watch_session()
RETURNS TRIGGER AS $$
DECLARE
    partner UUID;
BEGIN
    partner := get_partner_id(NEW.created_by, NEW.couple_id);

    IF partner IS NOT NULL AND (TG_OP = 'INSERT' AND NEW.status IN ('created', 'active')) THEN
        INSERT INTO public.notifications (
            recipient_id,
            actor_id,
            type,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            partner,
            NEW.created_by,
            'created',
            'watch_together',
            NEW.id::text,
            jsonb_build_object('title', NEW.title, 'media_id', NEW.media_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_partner_watch_session ON public.watch_sessions;
CREATE TRIGGER trigger_notify_partner_watch_session
    AFTER INSERT ON public.watch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION notify_partner_watch_session();

-- 10. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
