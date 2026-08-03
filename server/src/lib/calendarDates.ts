import { toVisitDate } from './visitDates';

/** UTC calendar noon for "today" */
export function utcTodayNoon(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0),
  );
}

/** UTC calendar noon for n days after a reference day (default today) */
export function utcAddDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return toVisitDate(d);
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export { toVisitDate };
