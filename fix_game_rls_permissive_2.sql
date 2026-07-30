-- Permissive policies for the rest of the game tables

-- 1. session_question_assignments
DROP POLICY IF EXISTS "Couples can view assignments" ON public.session_question_assignments;
DROP POLICY IF EXISTS "Couples can insert assignments" ON public.session_question_assignments;

CREATE POLICY "Couples can view assignments" ON public.session_question_assignments FOR SELECT USING (true);
CREATE POLICY "Couples can insert assignments" ON public.session_question_assignments FOR INSERT WITH CHECK (true);

-- 2. game_answers
DROP POLICY IF EXISTS "Couples can view answers" ON public.game_answers;
DROP POLICY IF EXISTS "Couples can insert answers" ON public.game_answers;
DROP POLICY IF EXISTS "Couples can update answers" ON public.game_answers;

CREATE POLICY "Couples can view answers" ON public.game_answers FOR SELECT USING (true);
CREATE POLICY "Couples can insert answers" ON public.game_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Couples can update answers" ON public.game_answers FOR UPDATE USING (true);

-- 3. games (just in case they need to select from it and can't)
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);

-- 4. questions (just in case they need to select from it and can't)
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
