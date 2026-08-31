-- ==============================================================================
-- PEACE WATCH TOGETHER SCHEMA & REALTIME ENGINE
-- ==============================================================================

-- 1. WATCH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL DEFAULT 'youtube' CHECK (media_type IN ('youtube')),
    media_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'ended')),
    current_position NUMERIC NOT NULL DEFAULT 0,
    is_playing BOOLEAN NOT NULL DEFAULT false,
    last_action_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ
);

-- 2. WATCH CHAT MESSAGES TABLE (DURABLE CHAT)
CREATE TABLE IF NOT EXISTS public.watch_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watch_session_id UUID NOT NULL REFERENCES public.watch_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_watch_sessions_couple_status ON public.watch_sessions(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_watch_messages_session ON public.watch_messages(watch_session_id, created_at ASC);

-- 4. ENABLE REPLICA IDENTITY FULL FOR POSTGRES CHANGES
ALTER TABLE public.watch_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.watch_messages REPLICA IDENTITY FULL;

-- 5. REALTIME PUBLICATION
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

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_messages ENABLE ROW LEVEL SECURITY;

-- Couples can view, create, update, and end their own watch sessions
CREATE POLICY "Couples can manage their watch sessions" ON public.watch_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.couple_id = watch_sessions.couple_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.couple_id = watch_sessions.couple_id
        )
    );

-- Couples can read and post messages in their couple's watch sessions
CREATE POLICY "Couples can manage watch messages" ON public.watch_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.watch_sessions
            JOIN public.users ON users.couple_id = watch_sessions.couple_id
            WHERE watch_sessions.id = watch_messages.watch_session_id
              AND users.id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.watch_sessions
            JOIN public.users ON users.couple_id = watch_sessions.couple_id
            WHERE watch_sessions.id = watch_messages.watch_session_id
              AND users.id = auth.uid()
        )
    );

-- 7. AUTO-NOTIFY PARTNER WHEN WATCH SESSION STARTS
CREATE OR REPLACE FUNCTION notify_partner_watch_session()
RETURNS TRIGGER AS $$
DECLARE
    partner_id UUID;
    creator_name TEXT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status IN ('created', 'active')) THEN
        -- Find partner's ID
        SELECT CASE
            WHEN partner_one = NEW.created_by THEN partner_two
            ELSE partner_one
        END INTO partner_id
        FROM public.couples
        WHERE id = NEW.couple_id;

        -- Find creator's name
        SELECT name INTO creator_name
        FROM public.users
        WHERE id = NEW.created_by;

        IF partner_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                couple_id,
                user_id,
                title,
                message,
                type,
                metadata,
                created_at
            ) VALUES (
                NEW.couple_id,
                partner_id,
                '🎬 Watch Together Invitation',
                COALESCE(creator_name, 'Your partner') || ' started a Watch Together room: ' || NEW.title,
                'watch_together',
                json_build_object('watch_session_id', NEW.id, 'media_id', NEW.media_id, 'title', NEW.title),
                timezone('utc'::text, now())
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_partner_watch_session ON public.watch_sessions;
CREATE TRIGGER trigger_notify_partner_watch_session
    AFTER INSERT ON public.watch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION notify_partner_watch_session();
