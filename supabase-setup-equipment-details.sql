-- Farm Wife — Equipment identification fields
-- Run in your Supabase SQL Editor. Additive migration for accounts whose
-- `equipment` table was already created before Year/Make/Model/Serial were
-- added to supabase-setup-equipment.sql.

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS make text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS serial_number text;

NOTIFY pgrst, 'reload schema';
