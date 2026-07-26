import { formatVisitDate, getVisitStatus } from '../lib/visitDates'
import './VisitComponents.css'

const STATUS_LABEL = {
  upcoming: 'Upcoming',
  ongoing: 'Happening now',
  past: 'Past visit',
}

/**
 * @param {Object} props
 * @param {{
 *   id?: string,
 *   start_date: Date | string,
 *   end_date: Date | string,
 *   visitingPartnerId?: string | null,
 *   visitingPartner?: { id: string, displayName: string } | null,
 * }} props.visit
 * @param {() => void} [props.onEdit]
 * @param {() => void} [props.onDelete]
 * @param {boolean} [props.deleting]
 */
export default function VisitCard({ visit, onEdit, onDelete, deleting = false }) {
  const status = getVisitStatus(visit.start_date, visit.end_date)
  const travelerName = visit.visitingPartner?.displayName

  return (
    <article className={`visit-card visit-card--${status}`}>
      <div className="visit-card__top">
        <span className={`visit-card__badge visit-card__badge--${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <h3 className="visit-card__title">Next time together</h3>

      {travelerName ? (
        <p className="visit-card__traveler">
          <span className="visit-card__traveler-label">Visiting</span>
          <span className="visit-card__traveler-name">{travelerName}</span>
        </p>
      ) : null}

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
