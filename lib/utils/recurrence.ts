import type { RecurrenceType } from '../types';

export interface RecurrenceInput {
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

/**
 * Computes the next due date for a recurring service record, given when it
 * was just completed. Returns null when there's nothing to schedule
 * (one-time records, or malformed recurrence fields).
 */
export function calculateNextDue(record: RecurrenceInput, completedAt: Date): Date | null {
  switch (record.recurrence_type) {
    case 'none':
      return null;

    case 'interval': {
      if (!record.recurrence_interval || record.recurrence_interval <= 0) return null;
      return new Date(startOfDay(completedAt).getTime() + record.recurrence_interval * MS_PER_DAY);
    }

    case 'monthly': {
      if (!record.recurrence_day) return null;
      return nextMonthlyDay(completedAt, record.recurrence_day);
    }

    default:
      return null;
  }
}
