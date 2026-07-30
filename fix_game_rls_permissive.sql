-- 1. Drop existing policies just in case they are conflicting
DROP POLICY IF EXISTS "Couples can view invitations" ON public.game_invitations;
DROP POLICY IF EXISTS "Couples can insert invitations" ON public.game_invitations;
DROP POLICY IF EXISTS "Couples can update invitations" ON public.game_invitations;

-- 2. Create ultra-permissive policies for debugging
CREATE POLICY "Couples can view invitations" ON public.game_invitations FOR SELECT USING (true);
CREATE POLICY "Couples can insert invitations" ON public.game_invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Couples can update invitations" ON public.game_invitations FOR UPDATE USING (true);

-- Same for game_sessions
DROP POLICY IF EXISTS "Couples can view their sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Couples can update their sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Couples can insert their sessions" ON public.game_sessions;

CREATE POLICY "Couples can view their sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Couples can update their sessions" ON public.game_sessions FOR UPDATE USING (true);
CREATE POLICY "Couples can insert their sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
