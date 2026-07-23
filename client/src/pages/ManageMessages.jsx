import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import DashboardOrbs from '../components/DashboardOrbs'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { MOODS, formatMoodLabel } from '../constants/moods'
import './Dashboard.css'
import './ManageMessages.css'

/**
 * @typedef {Object} MoodMessage
 * @property {string} id
 * @property {string} mood
 * @property {string} message
 */

export default function ManageMessages() {
  const [messages, setMessages] = useState(/** @type {MoodMessage[]} */ ([]))
  const [formData, setFormData] = useState({ mood: '', message: '' })
  const [editingMessageId, setEditingMessageId] = useState(
    /** @type {string | null} */ (null),
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchMoodMessages() {
      setLoading(true)
      setError('')

      try {
        const data = await client('/api/moodMessages')
        if (!cancelled) {
          setMessages(Array.isArray(data.moodMessages) ? data.moodMessages : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMoodMessages()

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e
   */
  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  /**
   * @param {MoodMessage} item
   */
  function startEdit(item) {
    setEditingMessageId(item.id)
    setFormData({ mood: item.mood, message: item.message })
    setError('')
  }

  function cancelEdit() {
    setEditingMessageId(null)
    setFormData({ mood: '', message: '' })
  }

  function dismissError() {
    setError('')
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (editingMessageId) {
        const data = await client(`/api/moodMessages/${editingMessageId}`, {
          method: 'PATCH',
          body: formData,
        })
        setMessages(
          messages.map((item) =>
            item.id === editingMessageId ? data.moodMessage : item,
          ),
        )
      } else {
        const data = await client('/api/moodMessages', { body: formData })
        setMessages([data.moodMessage, ...messages])
      }

      setFormData({ mood: '', message: '' })
      setEditingMessageId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * @param {string} id
   */
  async function handleDelete(id) {
    setDeletingId(id)
    setError('')

    try {
      await client(`/api/moodMessages/${id}`, { method: 'DELETE' })
      setMessages(messages.filter((item) => item.id !== id))
      if (editingMessageId === id) {
        cancelEdit()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="dashboard-page">
      <DashboardOrbs />

      <section className="dashboard-page__content">
        <h1 className="dashboard-page__title">Manage messages</h1>
        <p className="dashboard-page__text">
          Write short notes for each mood. Your partner will see one when they tap how they feel.
        </p>

        <div className="dashboard-page__stack">
          <ErrorBanner message={error} onDismiss={dismissError} />

          <form className="manage-form" onSubmit={handleSubmit}>
            <span className="manage-form__badge">Library</span>
            <h2 className="manage-form__title">
              {editingMessageId ? 'Edit message' : 'Add a message'}
            </h2>

            <div className="manage-form__field">
              <label htmlFor="mood">Mood</label>
              <select
                id="mood"
                name="mood"
                value={formData.mood}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Choose a mood
                </option>
                {MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {formatMoodLabel(mood)}
                  </option>
                ))}
              </select>
            </div>

            <div className="manage-form__field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Write something warm and personal..."
                maxLength={500}
                required
              />
            </div>

            <div className="manage-form__actions">
              {editingMessageId ? (
                <button
                  type="button"
                  className="manage-btn manage-btn--ghost"
                  onClick={cancelEdit}
                  disabled={submitting}
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                className="manage-btn manage-btn--primary"
                disabled={submitting}
              >
                {submitting
                  ? 'Saving...'
                  : editingMessageId
                    ? 'Update message'
                    : 'Add message'}
              </button>
            </div>
          </form>

          <div>
            <p className="dashboard-page__label">Your messages</p>
            {loading ? (
              <LoadingSpinner label="Loading your library..." />
            ) : messages.length === 0 ? (
              <p className="dashboard-page__text">
                No messages yet. Add one above to get started.
              </p>
            ) : (
              <div className="manage-list">
                {messages.map((item) => (
                  <article key={item.id} className="manage-card">
                    <span className="manage-card__mood">{formatMoodLabel(item.mood)}</span>
                    <p className="manage-card__text">{item.message}</p>
                    <div className="manage-card__actions">
                      <button
                        type="button"
                        className="manage-btn manage-btn--ghost"
                        onClick={() => startEdit(item)}
                        disabled={submitting || deletingId === item.id}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="manage-btn manage-btn--danger"
                        onClick={() => handleDelete(item.id)}
                        disabled={submitting || deletingId === item.id}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <p className="dashboard-page__text">
            <Link to="/moods" className="dashboard-page__link">
              Back to moods
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
