-- Farm Wife — Equipment Service Records
-- Run these commands in your Supabase SQL Editor
-- Additive only — does not touch the existing transactions table or storage setup.

-- 1. User settings table (module gating only — no custody/subscription/Outlook
--    fields; those belonged to the superseded Life OS plan)
CREATE TABLE IF NOT EXISTS user_settings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users on delete cascade,
  enabled_modules text[] not null default '{}', -- e.g. 'equipment'
  created_at      timestamptz not null default now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
FOR DELETE USING (auth.uid() = user_id);

-- 2. Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  category   text not null,
  notes      text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_user_id ON equipment(user_id);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own equipment" ON equipment
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment" ON equipment
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment" ON equipment
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment" ON equipment
FOR DELETE USING (auth.uid() = user_id);

-- 3. Equipment service records — each row is one occurrence (current
--    pending or already completed). Completing a recurring record never
--    mutates it forward; a new row is inserted for the next occurrence,
--    preserving full service history per piece of equipment.
CREATE TABLE IF NOT EXISTS equipment_service_records (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade,
  equipment_id         uuid not null references equipment(id) on delete cascade,
  service_type         text not null,
  notes                text,
  recurrence_type      text not null default 'none', -- 'none' | 'interval' | 'monthly'
  recurrence_interval  integer,        -- days between recurrence (if interval)
  recurrence_day       integer,        -- day of month, 1-31 (if monthly)
  next_due             timestamptz not null,
  status               text not null default 'pending', -- 'pending' | 'complete'
  completed_at         timestamptz,
  notification_id      text,           -- expo-notifications scheduled id, for cancel/reschedule
  created_at           timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_service_records_user_id ON equipment_service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_equipment_id ON equipment_service_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_records_next_due ON equipment_service_records(next_due);

ALTER TABLE equipment_service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service records" ON equipment_service_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service records" ON equipment_service_records
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service records" ON equipment_service_records
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service records" ON equipment_service_records
FOR DELETE USING (auth.uid() = user_id);

-- 4. To roll out Equipment for a specific account (no in-app settings UI
--    yet — see docs/ROADMAP.md decision log), run:
-- INSERT INTO user_settings (user_id, enabled_modules) VALUES ('<uuid>', '{equipment}')
-- ON CONFLICT (user_id) DO UPDATE SET enabled_modules = array_append(user_settings.enabled_modules, 'equipment');
-- (works whether or not the app has already auto-created a settings row for that user)
