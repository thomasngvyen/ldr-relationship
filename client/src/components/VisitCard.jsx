import './VisitComponents.css'

/**
 * @param {Date | string} value
 * @returns {string}
 */
function formatVisitDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * @param {Date | string} start
 * @param {Date | string} end
 * @returns {'upcoming' | 'ongoing' | 'past'}
 */
function getVisitStatus(start, end) {
  const now = Date.now()
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()

  if (now < startMs) return 'upcoming'
  if (now <= endMs) return 'ongoing'
  return 'past'
}

const STATUS_LABEL = {
  upcoming: 'Upcoming',
  ongoing: 'Happening now',
  past: 'Past visit',
}

/**
 * @param {Object} props
 * @param {{ id?: string, start_date: Date | string, end_date: Date | string }} props.visit
 * @param {() => void} [props.onEdit]
 * @param {() => void} [props.onDelete]
 * @param {boolean} [props.deleting]
 */
export default function VisitCard({ visit, onEdit, onDelete, deleting = false }) {
  const status = getVisitStatus(visit.start_date, visit.end_date)

  return (
    <article className={`visit-card visit-card--${status}`}>
      <div className="visit-card__top">
        <span className={`visit-card__badge visit-card__badge--${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <h3 className="visit-card__title">Next time together</h3>

      <div className="visit-card__dates">
        <div className="visit-card__date-block">
          <span className="visit-card__date-label">Starts</span>
          <span className="visit-card__date-value">{formatVisitDate(visit.start_date)}</span>
        </div>
        <div className="visit-card__divider" aria-hidden="true" />
        <div className="visit-card__date-block">
          <span className="visit-card__date-label">Ends</span>
          <span className="visit-card__date-value">{formatVisitDate(visit.end_date)}</span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="visit-card__actions">
          {onEdit ? (
            <button type="button" className="visit-card__btn visit-card__btn--edit" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="visit-card__btn visit-card__btn--delete"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
