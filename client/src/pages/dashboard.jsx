import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * @typedef {Object} CoupleStatus
 * @property {boolean} paired
 * @property {{ id: string, inviteCode: string | null } | null} couple
 * @property {{ displayName: string } | null} partner
 */

export default function Dashboard() {
  const { user } = useAuth()
  const [status, setStatus] = useState(/** @type {CoupleStatus | null} */ (null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const data = await client('/api/couples/me')
        if (!cancelled) {
          setStatus(data)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const displayName = /** @type {{ displayName?: string } | null} */ (user)?.displayName

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">
        Welcome{displayName ? `, ${displayName}` : ''}
      </h1>

      {loading ? (
        <p className="mt-2 text-white/70">Loading your space…</p>
      ) : status?.paired ? (
        <p className="mt-2 text-white/70">
          Paired with <span className="text-[#f9a8d4]">{status.partner?.displayName}</span>.
          Your countdown and visit details will live here.
        </p>
      ) : (
        <p className="mt-2 text-white/70">
          You are not paired yet.{' '}
          <Link to="/pair" className="text-[#f9a8d4] underline underline-offset-2">
            Connect with your partner
          </Link>{' '}
          to unlock your shared dashboard.
        </p>
      )}
    </section>
  )
}
