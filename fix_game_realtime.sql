-- Enable Realtime for games tables
begin;
  -- Simply add them to the publication (if they are already there, it will harmlessly error, but we know they aren't!)
  alter publication supabase_realtime add table game_invitations;
  alter publication supabase_realtime add table game_sessions;
commit;
