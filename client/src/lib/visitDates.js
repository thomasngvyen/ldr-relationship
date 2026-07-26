/**
 * Visit dates are stored at UTC noon so calendar days stay stable across timezones.
 * Format and compare using UTC calendar days, not the local clock.
 */

/**
 * @param {Date | string | undefined | null} value
 * @returns {string} YYYY-MM-DD for date inputs
 */
export function toDateInputValue(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * @param {Date | string} value
 * @returns {string}
 */
export function formatVisitDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * End of the visit's UTC calendar day (inclusive).
 * @param {Date | string} value
 * @returns {number}
 */
export function endOfVisitUtcDay(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999,
  )
}

/**
 * Start of the visit's UTC calendar day.
 * @param {Date | string} value
 * @returns {number}
 */
export function startOfVisitUtcDay(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0,
  )
}

/**
 * @param {{ end_date: Date | string }} visit
 * @returns {boolean}
 */
export function isVisitUpcoming(visit) {
  return endOfVisitUtcDay(visit.end_date) >= Date.now()
}

/**
 * @param {Date | string} start
 * @param {Date | string} end
 * @returns {'upcoming' | 'ongoing' | 'past'}
 */
export function getVisitStatus(start, end) {
  const now = Date.now()
  const startMs = startOfVisitUtcDay(start)
  const endMs = endOfVisitUtcDay(end)

  if (now < startMs) return 'upcoming'
  if (now <= endMs) return 'ongoing'
  return 'past'
}
