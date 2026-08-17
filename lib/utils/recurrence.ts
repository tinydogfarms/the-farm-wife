import type { RecurrenceType } from '../types';
import { WEEKDAYS } from '../constants/taskCategories';

export interface RecurrenceInput {
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: string | null;
  custody_week?: 'mine' | 'theirs' | null;
}

export interface CustodySettings {
  custody_week_start?: string | null;
  custody_alternates?: boolean | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextWeekday(after: Date, weekdayName: string): Date | null {
  const targetIndex = WEEKDAYS.indexOf(weekdayName.toLowerCase() as (typeof WEEKDAYS)[number]);
  if (targetIndex < 0) return null;

  const result = startOfDay(after);
  do {
    result.setDate(result.getDate() + 1);
  } while (result.getDay() !== targetIndex);

  return result;
}

function nextMonthlyDay(after: Date, dayOfMonth: number): Date | null {
  if (dayOfMonth < 1 || dayOfMonth > 31) return null;

  const candidate = new Date(after.getFullYear(), after.getMonth(), dayOfMonth);
  if (candidate.getDate() !== dayOfMonth) {
    // dayOfMonth doesn't exist in this month (e.g. Feb 30) — clamp to month end
    candidate.setMonth(candidate.getMonth() + 1, 0);
  }

  if (candidate > startOfDay(after)) {
    return candidate;
  }

  // Day already passed this month — roll to next month
  const nextMonth = new Date(after.getFullYear(), after.getMonth() + 1, dayOfMonth);
  if (nextMonth.getDate() !== dayOfMonth) {
    nextMonth.setMonth(nextMonth.getMonth() + 1, 0);
  }
  return nextMonth;
}

function nextCustodyWeekStart(
  after: Date,
  desired: 'mine' | 'theirs',
  custodyStart: Date,
  alternates: boolean
): Date {
  const afterDay = startOfDay(after);
  const startDay = startOfDay(custodyStart);

  const weeksSinceStart = Math.floor((afterDay.getTime() - startDay.getTime()) / (7 * MS_PER_DAY));
  let blockIndex = Math.max(weeksSinceStart, -1) + 1; // first block strictly after `after`

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const blockStart = new Date(startDay.getTime() + blockIndex * 7 * MS_PER_DAY);
    if (blockStart > afterDay) {
      const isMine = !alternates || blockIndex % 2 === 0;
      const blockType: 'mine' | 'theirs' = isMine ? 'mine' : 'theirs';
      if (blockType === desired) {
        return blockStart;
      }
    }
    blockIndex += 1;
  }
}

/**
 * Computes the next due date for a recurring task, given when it was just
 * completed. Returns null when there's nothing to schedule (one-time tasks,
 * or recurrence types missing the settings/fields they need).
 */
export function calculateNextDue(
  task: RecurrenceInput,
  completedAt: Date,
  settings?: CustodySettings
): Date | null {
  switch (task.recurrence_type) {
    case 'none':
      return null;

    case 'interval': {
      if (!task.recurrence_interval || task.recurrence_interval <= 0) return null;
      return new Date(startOfDay(completedAt).getTime() + task.recurrence_interval * MS_PER_DAY);
    }

    case 'weekday': {
      if (!task.recurrence_day) return null;
      return nextWeekday(completedAt, task.recurrence_day);
    }

    case 'monthly': {
      if (!task.recurrence_day) return null;
      const day = parseInt(task.recurrence_day, 10);
      if (Number.isNaN(day)) return null;
      return nextMonthlyDay(completedAt, day);
    }

    case 'custody_week': {
      if (!task.custody_week || !settings?.custody_week_start) return null;
      const custodyStart = new Date(settings.custody_week_start);
      if (Number.isNaN(custodyStart.getTime())) return null;
      return nextCustodyWeekStart(
        completedAt,
        task.custody_week,
        custodyStart,
        settings.custody_alternates ?? true
      );
    }

    default:
      return null;
  }
}
