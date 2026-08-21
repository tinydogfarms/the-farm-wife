-- Farm Wife — Weather (Home tab location)
-- Run in your Supabase SQL Editor.
-- Additive migration on the existing user_settings table — no new table,
-- no RLS changes (same four owner-scoped policies already cover it).

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS location_label text;

NOTIFY pgrst, 'reload schema';
