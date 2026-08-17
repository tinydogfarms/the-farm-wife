export type TaskCategory =
  | 'animal'
  | 'household'
  | 'cleaning'
  | 'grocery'
  | 'admin'
  | 'medical'
  | 'kid'
  | 'farm_ops';

export type TaskOwner = 'amanda' | 'husband' | 'shared';

export type RecurrenceType = 'none' | 'interval' | 'weekday' | 'monthly' | 'custody_week';

export type TaskStatus = 'pending' | 'complete' | 'skipped';

export type SharedPermission = 'read' | 'edit';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  owner: TaskOwner;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: string | null;
  custody_week?: 'mine' | 'theirs' | null;
  next_due?: string | null;
  estimated_duration?: number | null;
  notes?: string | null;
  status: TaskStatus;
  completed_at?: string | null;
  shared_with: string[];
  shared_permissions?: SharedPermission | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  category: TaskCategory;
  owner: TaskOwner;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: string | null;
  custody_week?: 'mine' | 'theirs' | null;
  next_due?: string | null;
  notes?: string | null;
}

export type ActivitySource = 'recap' | 'tap_timer' | 'dread_timer' | 'task_complete';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  raw_label: string;
  category?: string | null;
  source: ActivitySource;
  duration_seconds?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
  discovery_session: boolean;
  created_at: string;
}

export type ModuleKey = 'tasks' | 'lists' | 'discovery' | 'calendar' | 'admin_medical';

export type SubscriptionTier = 'free' | 'premium';

export interface UserSettings {
  id: string;
  user_id: string;
  enabled_modules: ModuleKey[];
  subscription_tier: SubscriptionTier;
  custody_week_start?: string | null;
  custody_alternates: boolean;
  outlook_token?: string | null;
  created_at: string;
  updated_at: string;
}
