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
