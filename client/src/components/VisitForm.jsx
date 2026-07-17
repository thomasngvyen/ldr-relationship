import { useState } from 'react'
import './VisitComponents.css'

/**
 * @param {Date | string | undefined} value
 * @returns {string}
 */
function toDateInputValue(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * @param {Object} props
 * @param {{ start_date?: Date | string, end_date?: Date | string } | null} [props.initialValues]
 * @param {(values: { start_date: string, end_date: string }) => void | Promise<void>} props.onSubmit
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.submitting]
 * @param {string} [props.submitLabel]
 */
export default function VisitForm({
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save visit',
}) {
  const [startDate, setStartDate] = useState(() => toDateInputValue(initialValues?.start_date))
  const [endDate, setEndDate] = useState(() => toDateInputValue(initialValues?.end_date))
  const [error, setError] = useState('')

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!startDate || !endDate) {
      setError('Please choose both a start and end date.')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Start date must be before end date.')
      return
    }

    try {
      await onSubmit({ start_date: startDate, end_date: endDate })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this visit.'
      setError(message)
    }
  }

  return (
    <form className="visit-form" onSubmit={handleSubmit}>
      <div className="visit-form__header">
        <span className="visit-form__badge">Plan a visit</span>
        <h3 className="visit-form__title">
          {initialValues ? 'Update your visit' : 'When will you see each other?'}
        </h3>
        <p className="visit-form__subtitle">
          Pick the dates for your next time together. Both of you will see the countdown.
        </p>
      </div>

      {error ? <p className="visit-form__error">{error}</p> : null}

      <div className="visit-form__fields">
        <div className="visit-form__field">
          <label htmlFor="visit-start-date">Start date</label>
          <input
            id="visit-start-date"
            type="date"
            name="start_date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </div>

        <div className="visit-form__field">
          <label htmlFor="visit-end-date">End date</label>
          <input
            id="visit-end-date"
            type="date"
            name="end_date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="visit-form__actions">
        {onCancel ? (
          <button
            type="button"
            className="visit-form__btn visit-form__btn--ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className="visit-form__btn visit-form__btn--primary"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
