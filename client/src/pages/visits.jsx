import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import DashboardOrbs from '../components/DashboardOrbs'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import VisitCard from '../components/VisitCard'
import VisitForm from '../components/VisitForm'
import './Dashboard.css'

/**
 * @typedef {Object} Visit
 * @property {string} id
 * @property {string} start_date
 * @property {string} end_date
 */

/**
 * @param {Visit} visit
 * @returns {boolean}
 */
function isUpcoming(visit) {
  return new Date(visit.end_date).getTime() >= Date.now()
}

/**
 * @param {Visit[]} visits
 * @returns {{ upcoming: Visit[], past: Visit[] }}
 */
function splitVisits(visits) {
  const upcoming = []
  const past = []

  for (const visit of visits) {
    if (isUpcoming(visit)) {
      upcoming.push(visit)
    } else {
      past.push(visit)
    }
  }

  upcoming.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  )
  past.sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  )

  return { upcoming, past }
}

export default function Visits() {
  const [paired, setPaired] = useState(false)
  const [visits, setVisits] = useState(/** @type {Visit[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(/** @type {Visit | null} */ (null))
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null))

  const loadVisits = useCallback(async () => {
    setError('')
    try {
      const data = await client('/api/visits')
      setVisits(Array.isArray(data.visits) ? data.visits : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load visits.'
      setError(message)
      setVisits([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      try {
        const coupleData = await client('/api/couples/me')
        if (cancelled) return

        setPaired(Boolean(coupleData.paired))

        if (coupleData.paired) {
          try {
            const visitData = await client('/api/visits')
            if (!cancelled) {
              setVisits(Array.isArray(visitData.visits) ? visitData.visits : [])
            }
          } catch (err) {
            if (!cancelled) {
              const message =
                err instanceof Error ? err.message : 'Could not load visits.'
              setError(message)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Could not load pairing status.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * @param {{ start_date: string, end_date: string }} values
   */
  async function handleSaveVisit(values) {
    setSubmitting(true)
    setError('')

    try {
      if (editingVisit) {
        await client(`/api/visits/${editingVisit.id}`, {
          method: 'PATCH',
          body: values,
        })
      } else {
        await client('/api/visits', { body: values })
      }

      await loadVisits()
      setEditingVisit(null)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * @param {Visit} visit
   */
  async function handleDeleteVisit(visit) {
    setDeletingId(visit.id)
    setError('')

    try {
      await client(`/api/visits/${visit.id}`, { method: 'DELETE' })
      await loadVisits()
      if (editingVisit?.id === visit.id) {
        setEditingVisit(null)
        setShowForm(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this visit.'
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  const { upcoming, past } = splitVisits(visits)

  return (
    <div className="dashboard-page">
      <DashboardOrbs />

      <section className="dashboard-page__content">
        <h1 className="dashboard-page__title">Visits</h1>
        <p className="dashboard-page__text">
          Plan upcoming trips and look back on the times you spent together.
        </p>

        {loading ? (
          <LoadingSpinner label="Loading your visits..." />
        ) : !paired ? (
          <p className="dashboard-page__text">
            You need to be paired first.{' '}
            <Link to="/pair" className="dashboard-page__link">
              Connect with your partner
            </Link>{' '}
            to manage visits.
          </p>
        ) : (
          <div className="dashboard-page__stack">
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {showForm ? (
              <VisitForm
                key={editingVisit ? editingVisit.id : 'new-visit'}
                initialValues={editingVisit}
                onSubmit={handleSaveVisit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingVisit(null)
                }}
                submitting={submitting}
                submitLabel={editingVisit ? 'Update visit' : 'Add visit'}
              />
            ) : (
              <button
                type="button"
                className="dashboard-page__cta"
                onClick={() => {
                  setEditingVisit(null)
                  setShowForm(true)
                }}
              >
                Plan a visit
              </button>
            )}

            <div className="dashboard-page__stack">
              <div>
                <p className="dashboard-page__label">Upcoming</p>
                {upcoming.length === 0 ? (
                  <p className="dashboard-page__text" style={{ margin: 0 }}>
                    No upcoming visits yet.
                  </p>
                ) : (
                  <div className="dashboard-page__stack">
                    {upcoming.map((visit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        onEdit={() => {
                          setEditingVisit(visit)
                          setShowForm(true)
                        }}
                        onDelete={() => handleDeleteVisit(visit)}
                        deleting={deletingId === visit.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="dashboard-page__label">Past</p>
                {past.length === 0 ? (
                  <p className="dashboard-page__text" style={{ margin: 0 }}>
                    Past visits will show up here.
                  </p>
                ) : (
                  <div className="dashboard-page__stack">
                    {past.map((visit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        onEdit={() => {
                          setEditingVisit(visit)
                          setShowForm(true)
                        }}
                        onDelete={() => handleDeleteVisit(visit)}
                        deleting={deletingId === visit.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="dashboard-page__text" style={{ margin: 0, textAlign: 'center' }}>
              <Link to="/dashboard" className="dashboard-page__link">
                Back to dashboard
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
