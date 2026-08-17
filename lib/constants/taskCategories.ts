import type { TaskCategory, TaskOwner, RecurrenceType } from '../types';
import { COLORS } from './theme';

export interface TaskCategoryDef {
  key: TaskCategory;
  label: string;
  color: string;
}

export const TASK_CATEGORIES: TaskCategoryDef[] = [
  { key: 'animal', label: 'Animal Care', color: COLORS.warning },
  { key: 'household', label: 'Household', color: COLORS.info },
  { key: 'cleaning', label: 'Cleaning', color: COLORS.success },
  { key: 'grocery', label: 'Grocery', color: '#a855f7' },
  { key: 'admin', label: 'Admin', color: COLORS.gray500 },
  { key: 'medical', label: 'Medical', color: COLORS.danger },
  { key: 'kid', label: 'Kid', color: '#ec4899' },
  { key: 'farm_ops', label: 'Farm Ops', color: '#65a30d' },
];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = TASK_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c.label }),
  {} as Record<TaskCategory, string>
);

export const TASK_OWNERS: { key: TaskOwner; label: string }[] = [
  { key: 'amanda', label: 'Amanda' },
  { key: 'husband', label: 'Husband' },
  { key: 'shared', label: 'Shared' },
];

export const RECURRENCE_TYPES: { key: RecurrenceType; label: string }[] = [
  { key: 'none', label: 'One-time' },
  { key: 'interval', label: 'Every N days' },
  { key: 'weekday', label: 'Weekly (day of week)' },
  { key: 'monthly', label: 'Monthly (day of month)' },
  { key: 'custody_week', label: 'Custody week' },
];

export const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;

export const WEEKDAY_LABELS = WEEKDAYS.map(d => d.charAt(0).toUpperCase() + d.slice(1));

export const CUSTODY_WEEK_OPTIONS: { key: 'mine' | 'theirs'; label: string }[] = [
  { key: 'mine', label: 'My week' },
  { key: 'theirs', label: "Their week" },
];

// Generic helper for Dropdown.tsx, which only deals in display strings:
// looks up the underlying key for a selected label from a { key, label }[] list.
export function findKeyByLabel<K extends string>(
  list: { key: K; label: string }[],
  label: string
): K | undefined {
  return list.find(item => item.label === label)?.key;
}

export function findLabelByKey<K extends string>(
  list: { key: K; label: string }[],
  key: K | undefined
): string {
  return list.find(item => item.key === key)?.label ?? '';
}
