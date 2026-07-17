import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import { useAuth } from '../context/AuthContext'
import CountdownTimer from '../components/CountdownTimer'
import VisitCard from '../components/VisitCard'
import VisitForm from '../components/VisitForm'
import './Dashboard.css'

/**
 * @typedef {Object} CoupleStatus
 * @property {boolean} paired
 * @property {{ id: string, inviteCode: string | null } | null} couple
 * @property {{ displayName: string } | null} partner
 */

/**
 * @typedef {Object} Visit
 * @property {string} id
 * @property {string} start_date
 * @property {string} end_date
 */

export default function Dashboard() {
  const { user } = useAuth()
  const [status, setStatus] = useState(/** @type {CoupleStatus | null} */ (null))
  const [nextVisit, setNextVisit] = useState(/** @type {Visit | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [visitsError, setVisitsError] = useState('')
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadNextVisit = useCallback(async () => {
    setVisitsError('')
    try {
      const data = await client('/api/visits/next')
      setNextVisit(data.visit ?? null)
      if (!data.visit) {
        setShowForm(true)
        setEditing(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load your next visit.'
      setVisitsError(message)
      setNextVisit(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      try {
        const coupleData = await client('/api/couples/me')
        if (cancelled) return

        setStatus(coupleData)

        if (coupleData.paired) {
          try {
            const visitData = await client('/api/visits/next')
            if (!cancelled) {
              setNextVisit(visitData.visit ?? null)
              if (!visitData.visit) {
                setShowForm(true)
              }
            }
          } catch (err) {
            if (!cancelled) {
              const message =
                err instanceof Error ? err.message : 'Could not load your next visit.'
              setVisitsError(message)
            }
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * @param {{ start_date: string, end_date: string }} values
   */
  async function handleSaveVisit(values) {
    setSubmitting(true)
    setVisitsError('')

    try {
      if (editing && nextVisit) {
        await client(`/api/visits/${nextVisit.id}`, {
          method: 'PATCH',
          body: values,
        })
      } else {
        await client('/api/visits', { body: values })
      }

      await loadNextVisit()
      setEditing(false)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteVisit() {
    if (!nextVisit) return

    setDeleting(true)
    setVisitsError('')

    try {
      await client(`/api/visits/${nextVisit.id}`, { method: 'DELETE' })
      setNextVisit(null)
      setEditing(false)
      setShowForm(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this visit.'
      setVisitsError(message)
    } finally {
      setDeleting(false)
    }
  }

  const displayName = /** @type {{ displayName?: string } | null} */ (user)?.displayName

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__orb dashboard-page__orb--one" aria-hidden="true" />
      <div className="dashboard-page__orb dashboard-page__orb--two" aria-hidden="true" />

      <section className="dashboard-page__content">
        <h1 className="dashboard-page__title">
          Welcome{displayName ? `, ${displayName}` : ''}
        </h1>

        {loading ? (
          <p className="dashboard-page__text">Loading your space...</p>
        ) : !status?.paired ? (
          <p className="dashboard-page__text">
            You are not paired yet.{' '}
            <Link to="/pair" className="dashboard-page__link">
              Connect with your partner
            </Link>{' '}
            to unlock your shared dashboard.
          </p>
        ) : (
          <div className="dashboard-page__stack">
            <p className="dashboard-page__text" style={{ margin: 0 }}>
              Paired with{' '}
              <span className="dashboard-page__accent">{status.partner?.displayName}</span>.
            </p>

            {visitsError ? <p className="dashboard-page__error">{visitsError}</p> : null}

            {nextVisit ? (
              <div className="dashboard-page__stack">
                <div>
                  <p className="dashboard-page__label">Until you see each other</p>
                  <CountdownTimer targetDate={nextVisit.start_date} />
                </div>

                <VisitCard
                  visit={nextVisit}
                  onEdit={() => {
                    setEditing(true)
                    setShowForm(true)
                  }}
                  onDelete={handleDeleteVisit}
                  deleting={deleting}
                />
              </div>
            ) : (
              <p className="dashboard-page__text" style={{ margin: 0 }}>
                No upcoming visit yet. Plan one below so your countdown can start.
              </p>
            )}

            {showForm ? (
              <VisitForm
                key={editing && nextVisit ? nextVisit.id : 'new-visit'}
                initialValues={editing && nextVisit ? nextVisit : null}
                onSubmit={handleSaveVisit}
                onCancel={
                  nextVisit
                    ? () => {
                        setShowForm(false)
                        setEditing(false)
                      }
                    : undefined
                }
                submitting={submitting}
                submitLabel={editing ? 'Update visit' : 'Plan visit'}
              />
            ) : (
              <button
                type="button"
                className="dashboard-page__cta"
                onClick={() => {
                  setEditing(false)
                  setShowForm(true)
                }}
              >
                Plan another visit
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
