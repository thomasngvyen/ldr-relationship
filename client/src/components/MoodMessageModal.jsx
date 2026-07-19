import { useEffect } from 'react'
import { formatMoodLabel } from '../constants/moods'
import './MoodMessageModal.css'

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string | null} props.mood
 * @param {string | null} props.message
 * @param {boolean} [props.loading]
 * @param {string} [props.error]
 * @param {() => void} props.onClose
 * @param {() => void} [props.onAnother]
 */
export default function MoodMessageModal({
  open,
  mood,
  message,
  loading = false,
  error = '',
  onClose,
  onAnother,
}) {
  useEffect(() => {
    if (!open) return

    /**
     * @param {KeyboardEvent} event
     */
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const moodLabel = mood ? formatMoodLabel(mood) : 'Mood'

  return (
    <div
      className="mood-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-modal-title"
    >
      <button
        type="button"
        className="mood-modal__backdrop"
        aria-label="Close message"
        onClick={onClose}
      />

      <div className="mood-modal__card">
        <span className="mood-modal__badge">A note for you</span>
        <h2 id="mood-modal-title" className="mood-modal__title">
          {loading ? 'Finding a message...' : `When you're feeling ${moodLabel.toLowerCase()}`}
        </h2>

        {loading ? (
          <p className="mood-modal__body mood-modal__body--muted">One moment...</p>
        ) : error ? (
          <p className="mood-modal__error">{error}</p>
        ) : (
          <p className="mood-modal__body">{message}</p>
        )}

        <div className="mood-modal__actions">
          {!loading && !error && onAnother ? (
            <button type="button" className="mood-modal__btn mood-modal__btn--ghost" onClick={onAnother}>
              Another one
            </button>
          ) : null}
          <button type="button" className="mood-modal__btn mood-modal__btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
