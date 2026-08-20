-- Farm Wife — Livestock Care Records
-- Run these commands in your Supabase SQL Editor.
-- Additive only — does not touch existing tables. Assumes
-- supabase-setup-equipment.sql has already run (needs the user_settings
-- table for module gating).

-- 1. Livestock table — one row per tracked unit: either a group/herd
--    (tracking_type = 'group', count = headcount) or an individually
--    tracked animal (tracking_type = 'individual', count = 1).
CREATE TABLE IF NOT EXISTS livestock (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  tracking_type text not null default 'group', -- 'group' | 'individual'
  name          text not null,
  species       text not null,
  breed         text,
  count         integer not null default 1,
  tag_number    text,
  birthdate     date,
  photo_url     text,
  notes         text,
  created_at    timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_livestock_user_id ON livestock(user_id);

ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own livestock" ON livestock
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own livestock" ON livestock
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own livestock" ON livestock
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own livestock" ON livestock
FOR DELETE USING (auth.uid() = user_id);

-- 2. Livestock care records — mirrors equipment_service_records: each row
--    is one occurrence (current pending or already completed). Completing
--    a recurring record never mutates it forward; a new row is inserted
--    for the next occurrence, preserving full care history per animal/herd.
CREATE TABLE IF NOT EXISTS livestock_care_records (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade,
  livestock_id         uuid not null references livestock(id) on delete cascade,
  care_type            text not null,
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

CREATE INDEX IF NOT EXISTS idx_care_records_user_id ON livestock_care_records(user_id);
CREATE INDEX IF NOT EXISTS idx_care_records_livestock_id ON livestock_care_records(livestock_id);
CREATE INDEX IF NOT EXISTS idx_care_records_next_due ON livestock_care_records(next_due);

ALTER TABLE livestock_care_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own care records" ON livestock_care_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own care records" ON livestock_care_records
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own care records" ON livestock_care_records
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own care records" ON livestock_care_records
FOR DELETE USING (auth.uid() = user_id);

-- 3. Storage bucket for livestock photos — separate from `receipts` (animal
--    photos are a different domain/lifecycle than financial documents),
--    same owner-scoped RLS pattern keyed on <user_id>/... path.
--    storage.objects RLS is already enabled by supabase-setup.sql step 4.
INSERT INTO storage.buckets (id, name, public)
VALUES ('livestock-photos', 'livestock-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own livestock photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'livestock-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own livestock photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'livestock-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own livestock photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'livestock-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. To roll out Livestock for a specific account (no in-app settings UI
--    yet — see docs/ROADMAP.md decision log), run:
-- INSERT INTO user_settings (user_id, enabled_modules) VALUES ('<uuid>', '{livestock}')
-- ON CONFLICT (user_id) DO UPDATE SET enabled_modules = array_append(user_settings.enabled_modules, 'livestock');
-- (works whether or not the app has already auto-created a settings row for that user)

NOTIFY pgrst, 'reload schema';
