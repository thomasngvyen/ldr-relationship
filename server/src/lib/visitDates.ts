/**
 * Normalize visit calendar dates to UTC noon so timezone shifts don't move the day.
 */
export function toVisitDate(input: Date | string): Date {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
  }

  const date = input instanceof Date ? input : new Date(input)
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  )
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}
