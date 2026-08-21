export interface AnnualDateInput {
  month: number; // 1-12
  day: number;   // 1-31
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildDateForYear(year: number, month: number, day: number): Date {
  const candidate = new Date(year, month - 1, day);
  if (candidate.getMonth() !== month - 1) {
    // day doesn't exist in this month for this year (e.g. Feb 29 in a
    // non-leap year) — clamp to month end, same technique as
    // recurrence.ts's nextMonthlyDay.
    return new Date(year, month, 0);
  }
  return candidate;
}

/**
 * Next occurrence of month/day on or after `after` (inclusive of today).
 */
export function nextAnnualOccurrence(input: AnnualDateInput, after: Date): Date {
  const startAfter = startOfDay(after);
  const candidate = buildDateForYear(after.getFullYear(), input.month, input.day);

  if (candidate < startAfter) {
    return buildDateForYear(after.getFullYear() + 1, input.month, input.day);
  }
  return candidate;
}
