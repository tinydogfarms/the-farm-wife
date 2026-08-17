-- Farm Wife Life OS — Phase 1: Core Task Engine + Categories
-- Run these commands in your Supabase SQL Editor
-- Additive only — does not touch the existing transactions table or storage setup.

-- 1. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  title               text not null,
  category            text not null, -- 'animal' | 'household' | 'cleaning' | 'grocery' | 'admin' | 'medical' | 'kid' | 'farm_ops'
  owner               text not null default 'amanda', -- 'amanda' | 'husband' | 'shared'
  recurrence_type     text not null default 'none', -- 'none' | 'interval' | 'weekday' | 'monthly' | 'custody_week'
  recurrence_interval integer,        -- days between recurrence (if interval)
  recurrence_day      text,           -- day of week or day of month (if weekday/monthly)
  custody_week        text,           -- 'mine' | 'theirs' (if custody_week type)
  next_due            timestamptz,
  estimated_duration  integer,        -- minutes; populated by Discovery Mode
  notes               text,
  status              text not null default 'pending', -- 'pending' | 'complete' | 'skipped'
  completed_at        timestamptz,
  shared_with         text[] not null default '{}',    -- user_ids (as text) with access to this row
  shared_permissions  text,           -- 'read' | 'edit'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_next_due ON tasks(next_due);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own or shared tasks" ON tasks
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid()::text = ANY(shared_with)
);

CREATE POLICY "Users can insert their own tasks" ON tasks
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update their own or shared-edit tasks" ON tasks
FOR UPDATE USING (
  auth.uid() = user_id OR (auth.uid()::text = ANY(shared_with) AND shared_permissions = 'edit')
);

CREATE POLICY "Users can delete their own tasks" ON tasks
FOR DELETE USING (
  auth.uid() = user_id
);

-- 2. Activity log table (foundation for Phase 3 Discovery Mode;
--    also used by the Phase 1 recurring task engine to record completions)
CREATE TABLE IF NOT EXISTS activity_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  raw_label           text not null,          -- what the user said/tapped
  category            text,                   -- mapped category
  source              text not null,          -- 'recap' | 'tap_timer' | 'dread_timer' | 'task_complete'
  duration_seconds    integer,                -- null if recap without timing
  started_at          timestamptz,
  ended_at            timestamptz,
  discovery_session   boolean not null default true,  -- false after Discovery Mode ends / for plain completions
  created_at          timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity log" ON activity_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity log" ON activity_log
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity log" ON activity_log
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity log" ON activity_log
FOR DELETE USING (auth.uid() = user_id);

-- 3. User settings table (module gating + custody schedule)
CREATE TABLE IF NOT EXISTS user_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users on delete cascade,
  enabled_modules     text[] not null default '{tasks,lists,discovery,calendar,admin_medical}',
  subscription_tier   text not null default 'free', -- 'free' | 'premium' (not enforced yet, reserved)
  custody_week_start  date,           -- first day of Amanda's first custody week
  custody_alternates  boolean not null default true, -- true = alternates every 7 days from start date
  outlook_token       text,           -- encrypted OAuth token for Graph API (Phase 4)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id);
