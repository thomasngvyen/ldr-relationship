import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import DashboardOrbs from '../components/DashboardOrbs'
import EnableNotifications from '../components/EnableNotifications'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import './Dashboard.css'
import './Feelings.css'

/**
 * @typedef {Object} FeelingRow
 * @property {string} id
 * @property {string} feeling
 * @property {string | null} reason
 * @property {string} createdAt
 * @property {{ id: string, displayName: string } | null} [user]
 */

export default function Feelings() {
  const [paired, setPaired] = useState(false)
  const [feelings, setFeelings] = useState(/** @type {FeelingRow[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [feeling, setFeeling] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const loadFeelings = useCallback(async () => {
    const data = await client('/api/feelings')
    setFeelings(Array.isArray(data.feelings) ? data.feelings : [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setPageError('')
      try {
        const coupleData = await client('/api/couples/me')
        if (cancelled) return
        setPaired(Boolean(coupleData.paired))
        if (coupleData.paired) {
          await loadFeelings()
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(err instanceof Error ? err.message : 'Could not load feelings.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPage()
    return () => {
      cancelled = true
    }
  }, [loadFeelings])

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    setSubmitting(true)
    try {
      await client('/api/feelings', {
        body: {
          feeling: feeling.trim(),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      })
      setFeeling('')
      setReason('')
      setFormSuccess('Shared. Your partner will get a notification if they enabled push.')
      await loadFeelings()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not share that feeling.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <DashboardOrbs />
        <div className="dashboard-page__inner">
          <LoadingSpinner label="Loading feelings…" />
        </div>
      </div>
    )
  }

  if (!paired) {
    return (
      <div className="dashboard-page">
        <DashboardOrbs />
        <div className="dashboard-page__inner">
          <h1 className="dashboard-page__title">Feelings</h1>
          <p className="dashboard-page__lead">
            Pair with your partner first to share how you’re feeling.
          </p>
          <Link to="/pair" className="dashboard-page__link">
            Go to pairing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <DashboardOrbs />
      <div className="dashboard-page__inner">
        <h1 className="dashboard-page__title">Feelings</h1>
        <p className="dashboard-page__lead">
          Share how you feel. Your partner gets a push to open HeartSync and read why.
        </p>

        <ErrorBanner message={pageError} onDismiss={() => setPageError('')} />
        <EnableNotifications />

        <form className="feelings-form" onSubmit={handleSubmit}>
          <label className="feelings-form__label" htmlFor="feeling">
            How are you feeling?
          </label>
          <input
            id="feeling"
            className="feelings-form__input"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            maxLength={255}
            required
            placeholder="Miss you, excited, tired…"
          />

          <label className="feelings-form__label" htmlFor="reason">
            Why? <span className="feelings-form__optional">(optional — shown in the app)</span>
          </label>
          <textarea
            id="reason"
            className="feelings-form__textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="A little more context for your partner…"
          />

          <ErrorBanner message={formError} onDismiss={() => setFormError('')} />
          {formSuccess ? (
            <p className="feelings-form__success" role="status">
              {formSuccess}
            </p>
          ) : null}

          <button type="submit" className="feelings-form__submit" disabled={submitting}>
            {submitting ? 'Sharing…' : 'Share feeling'}
          </button>
        </form>

        <section className="feelings-list" aria-label="Recent feelings">
          <h2 className="feelings-list__title">Recent</h2>
          {feelings.length === 0 ? (
            <p className="feelings-list__empty">No feelings shared yet.</p>
          ) : (
            <ul className="feelings-list__items">
              {feelings.map((row) => (
                <li key={row.id} className="feelings-list__item">
                  <p className="feelings-list__feeling">{row.feeling}</p>
                  {row.reason ? <p className="feelings-list__reason">{row.reason}</p> : null}
                  <p className="feelings-list__meta">
                    {row.user?.displayName ?? 'Partner'} ·{' '}
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
