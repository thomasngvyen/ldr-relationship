import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import DashboardOrbs from '../components/DashboardOrbs'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import MoodMessageModal from '../components/MoodMessageModal'
import { MQ } from '../constants/breakpoints'
import { MOOD_META, MOODS, formatMoodLabel } from '../constants/moods'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './Dashboard.css'
import './Moods.css'

export default function Moods() {
  const isMobile = useMediaQuery(MQ.mobile)
  const [paired, setPaired] = useState(false)
  const [moods, setMoods] = useState(/** @type {string[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [selectedMood, setSelectedMood] = useState(/** @type {string | null} */ (null))
  const [message, setMessage] = useState(/** @type {string | null} */ (null))
  const [modalOpen, setModalOpen] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [deliverError, setDeliverError] = useState('')

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
          try {
            const moodData = await client('/api/moods')
            if (!cancelled) {
              setMoods(Array.isArray(moodData.moods) ? moodData.moods : [...MOODS])
            }
          } catch {
            if (!cancelled) {
              setMoods([...MOODS])
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const messageText =
            err instanceof Error ? err.message : 'Could not load moods.'
          setPageError(messageText)
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

  const deliverMood = useCallback(
    /** @param {string} mood */
    async (mood) => {
    setSelectedMood(mood)
    setModalOpen(true)
    setDelivering(true)
    setDeliverError('')
    setMessage(null)

    try {
      const data = await client(`/api/moods/${mood}/deliver`, { method: 'POST' })
      setMessage(data.moodMessage?.message ?? null)
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : 'Could not get a message for that mood.'
      setDeliverError(messageText)
    } finally {
      setDelivering(false)
    }
  }, [])

  function closeModal() {
    setModalOpen(false)
    setDeliverError('')
    setMessage(null)
    setSelectedMood(null)
  }

  return (
    <div className="dashboard-page">
      <DashboardOrbs />

      <section className="dashboard-page__content">
        <h1 className="dashboard-page__title">Moods</h1>
        <p className="dashboard-page__text">
          Tap how you feel and open a short message written for you.
        </p>

        {loading ? (
          <LoadingSpinner label="Loading moods..." />
        ) : !paired ? (
          <p className="dashboard-page__text">
            You need to be paired first.{' '}
            <Link to="/pair" className="dashboard-page__link">
              Connect with your partner
            </Link>{' '}
            to unlock mood messages.
          </p>
        ) : (
          <div className="dashboard-page__stack">
            <ErrorBanner message={pageError} onDismiss={() => setPageError('')} />

            <div
              className={isMobile ? 'mood-grid mood-grid--compact' : 'mood-grid'}
              role="list"
            >
              {moods.map((mood) => {
                const meta = MOOD_META[mood] ?? {
                  label: formatMoodLabel(mood),
                  blurb: 'Tap for a message',
                }

                return (
                  <button
                    key={mood}
                    type="button"
                    role="listitem"
                    className="mood-grid__btn"
                    onClick={() => deliverMood(mood)}
                    disabled={delivering}
                  >
                    <span className="mood-grid__label">{meta.label}</span>
                    {!isMobile ? (
                      <span className="mood-grid__blurb">{meta.blurb}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <p className="dashboard-page__text" style={{ margin: 0, textAlign: 'center' }}>
              <Link to="/messages/manage" className="dashboard-page__link">
                Manage message library
              </Link>
              {' · '}
              <Link to="/dashboard" className="dashboard-page__link">
                Back to dashboard
              </Link>
            </p>
          </div>
        )}
      </section>

      <MoodMessageModal
        open={modalOpen}
        mood={selectedMood}
        message={message}
        loading={delivering}
        error={deliverError}
        onClose={closeModal}
        onAnother={selectedMood && !delivering ? () => deliverMood(selectedMood) : undefined}
      />
    </div>
  )
}
