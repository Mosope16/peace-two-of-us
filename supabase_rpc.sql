-- 1. Add Status and Archive columns to Couples table
ALTER TABLE couples ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'connected', 'archived'));
ALTER TABLE couples ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

-- 2. Create the Transactional RPC for joining a couple
CREATE OR REPLACE FUNCTION join_couple(p_invite_code TEXT, p_user_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
    target_couple_id TEXT;
    target_partner_one TEXT;
    target_partner_two TEXT;
    target_status TEXT;
    target_is_archived BOOLEAN;
    user_existing_couple_id TEXT;
    user_existing_status TEXT;
BEGIN
    -- Standardize invite code format
    p_invite_code := UPPER(TRIM(p_invite_code));

    -- 1. Fetch the target couple
    SELECT id, partner_one, partner_two, status, is_archived
    INTO target_couple_id, target_partner_one, target_partner_two, target_status, target_is_archived
    FROM couples
    WHERE invite_code = p_invite_code;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invite code not found.');
    END IF;

    -- 2. Validate target couple state
    IF target_is_archived THEN
        RETURN json_build_object('success', false, 'error', 'This couple space has been archived.');
    END IF;

    IF target_partner_two IS NOT NULL OR target_status = 'connected' THEN
        RETURN json_build_object('success', false, 'error', 'This couple space is already full.');
    END IF;

    IF target_partner_one = p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'You cannot join your own couple space.');
    END IF;

    -- 3. Check current user's existing couple status (to prevent overwriting active relationships)
    SELECT c.id, c.status
    INTO user_existing_couple_id, user_existing_status
    FROM users u
    LEFT JOIN couples c ON u.couple_id = c.id
    WHERE u.id = p_user_id;

    IF user_existing_status = 'connected' THEN
        RETURN json_build_object('success', false, 'error', 'You are already connected to a partner in an active couple space.');
    END IF;

    -- 4. Begin Updates (Atomic)
    
    -- Update the target couple
    UPDATE couples 
    SET partner_two = p_user_id,
        status = 'connected'
    WHERE id = target_couple_id;

    -- Update the joining user
    UPDATE users 
    SET couple_id = target_couple_id
    WHERE id = p_user_id;

    -- 5. Archive the user's old empty couple (if they had one)
    IF user_existing_couple_id IS NOT NULL AND user_existing_couple_id != target_couple_id THEN
        UPDATE couples
        SET is_archived = true,
            status = 'archived',
            archived_at = NOW(),
            archive_reason = 'joined_another_couple'
        WHERE id = user_existing_couple_id;
    END IF;

    RETURN json_build_object('success', true, 'couple_id', target_couple_id);
END;
$$;
