import type { CustomOffsetUnit } from '../types';

// 30/21/14/7 days before, then every day from 6 down to 1 day before,
// then the day itself. 11 entries.
export const CASCADE_OFFSETS_DAYS = [30, 21, 14, 7, 6, 5, 4, 3, 2, 1, 0] as const;

const REMINDER_HOUR = 9; // 9:00 AM local — reminders have no time field, this is a fixed default
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function atReminderHour(date: Date): Date {
  const result = new Date(date);
  result.setHours(REMINDER_HOUR, 0, 0, 0);
  return result;
}

export interface CascadeStep {
  offsetDays: number;
  fireAt: Date;
}

/**
 * Computes the fire dates for the "all the reminders" cascade, relative
 * to a known next occurrence. All at REMINDER_HOUR local time.
 */
export function computeCascadeFireDates(occurrence: Date): CascadeStep[] {
  return CASCADE_OFFSETS_DAYS.map(offsetDays => ({
    offsetDays,
    fireAt: atReminderHour(new Date(occurrence.getTime() - offsetDays * MS_PER_DAY)),
  }));
}

/** Short human phrase for a cascade step, e.g. "Today", "Tomorrow", "In 7 days". */
export function describeCascadeStep(offsetDays: number): string {
  if (offsetDays === 0) return 'Today';
  if (offsetDays === 1) return 'Tomorrow';
  return `In ${offsetDays} days`;
}

/** Short human phrase for a custom offset, e.g. "2 weeks away". */
export function describeCustomOffset(amount: number, unit: CustomOffsetUnit): string {
  const label = amount === 1 ? unit.slice(0, -1) : unit;
  return `${amount} ${label} away`;
}

/**
 * Computes the single fire date for a "custom" lead-time reminder.
 * 'days'/'weeks' are plain day-count subtraction; 'months' uses real
 * calendar-month subtraction (not a 30-day approximation) since "a month
 * before" is a calendar-relative concept — clamped to month-end the same
 * way lib/utils/recurrence.ts clamps short months.
 */
export function computeCustomFireDate(occurrence: Date, amount: number, unit: CustomOffsetUnit): Date {
  if (unit === 'months') {
    const year = occurrence.getFullYear();
    const month = occurrence.getMonth() - amount;
    const day = occurrence.getDate();
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() !== ((month % 12) + 12) % 12) {
      // day doesn't exist in the target month — clamp to month end
      return atReminderHour(new Date(year, month + 1, 0));
    }
    return atReminderHour(candidate);
  }

  const offsetDays = unit === 'weeks' ? amount * 7 : amount;
  return atReminderHour(new Date(occurrence.getTime() - offsetDays * MS_PER_DAY));
}
