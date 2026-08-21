-- Farm Wife — Reminders (birthdays, anniversaries, other annual events)
-- Run in your Supabase SQL Editor.
-- Additive only — does not touch existing tables. Assumes
-- supabase-setup-equipment.sql has already run (needs the user_settings
-- table for module gating).

-- Default behavior is a Home-tab list only, computed live from
-- event_month/event_day — no notification scheduling. A reminder marked
-- is_critical also gets real local notifications (a fixed cascade of 11,
-- or a single custom lead-time reminder), tracked via scheduled_year +
-- notification_ids so they can be reconciled/rescheduled each year.
CREATE TABLE IF NOT EXISTS reminders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users on delete cascade,
  name                  text not null,
  event_type            text not null default 'Birthday', -- 'Birthday' | 'Anniversary' | 'Other'
  event_month           integer not null, -- 1-12, drives yearly recurrence
  event_day             integer not null, -- 1-31, drives yearly recurrence
  event_year            integer,          -- original year, for "turns X"/"Nth anniversary" display later
  is_critical           boolean not null default false, -- also gets real notifications, not just the Home list
  schedule_type         text,             -- 'all' | 'custom' — only meaningful when is_critical
  custom_offset_amount  integer,          -- only when schedule_type = 'custom'
  custom_offset_unit    text,             -- 'days' | 'weeks' | 'months'
  notes                 text,
  scheduled_year        integer,          -- year the currently-outstanding notification_ids target; null = not scheduled
  notification_ids      text[] not null default '{}', -- outstanding scheduled ids (only used when is_critical)
  created_at            timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders" ON reminders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON reminders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON reminders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON reminders
FOR DELETE USING (auth.uid() = user_id);

-- To roll out Reminders for a specific account (no in-app settings UI
-- yet — see docs/ROADMAP.md decision log), run:
-- INSERT INTO user_settings (user_id, enabled_modules) VALUES ('<uuid>', '{reminders}')
-- ON CONFLICT (user_id) DO UPDATE SET enabled_modules = array_append(user_settings.enabled_modules, 'reminders');
-- (works whether or not the app has already auto-created a settings row for that user)

NOTIFY pgrst, 'reload schema';
