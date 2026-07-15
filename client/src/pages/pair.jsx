import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { client } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * @typedef {Object} CoupleStatus
 * @property {boolean} paired
 * @property {{ id: string, inviteCode: string | null, userAId: string, userBId: string | null } | null} couple
 * @property {{ id: string, email: string, displayName: string } | null} partner
 */

export default function Pair() {
  const { user } = useAuth()
  const [status, setStatus] = useState(/** @type {CoupleStatus | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('create')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      setLoading(true)
      setError('')

      try {
        const data = await client('/api/couples/me')
        if (!cancelled) {
          setStatus(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Could not load your pairing status.'
          setError(message)
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

  async function handleCreateInvite() {
    setError('')
    setSubmitting(true)

    try {
      const data = await client('/api/couples/invite', { method: 'POST' })
      setStatus({
        paired: false,
        couple: data.couple,
        partner: null,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create an invite code.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleJoin(event) {
    event.preventDefault()
    if (!user) return

    setError('')
    setSubmitting(true)

    try {
      const data = await client('/api/couples/pair', {
        method: 'POST',
        body: { inviteCode: inviteCode.trim() },
      })
      const currentUserId = /** @type {{ id: string }} */ (user).id
      setStatus({
        paired: true,
        couple: data.couple,
        partner:
          data.couple.userA?.id === currentUserId
            ? data.couple.userB
            : data.couple.userA,
      })
      setInviteCode('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not join with that invite code.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * @param {string} code
   */
  async function handleCopy(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the invite code. Please copy it manually.')
    }
  }

  const waitingCode = status?.couple?.inviteCode
  const partnerName = status?.partner?.displayName

  return (
    <AuthShell
      title={status?.paired ? "You're paired!" : 'Connect with your partner'}
      subtitle={
        status?.paired
          ? `You and ${partnerName} are ready to share your space.`
          : waitingCode
            ? 'Share this invite code so your partner can join you.'
            : 'Create an invite or enter your partner’s code to link your accounts.'
      }
      footerText={status?.paired ? 'Head to your' : 'Skip for now and go to'}
      footerLink="/dashboard"
      footerLabel="dashboard"
    >
      {loading ? (
        <p className="auth-muted">Loading your pairing status…</p>
      ) : status?.paired ? (
        <div className="auth-pair-success">
          <div className="auth-pair-avatar" aria-hidden="true">
            {partnerName?.charAt(0)?.toUpperCase() ?? '♥'}
          </div>
          <p className="auth-pair-name">{partnerName}</p>
          <p className="auth-muted">Your shared countdown and message board are waiting.</p>
          <Link to="/dashboard" className="auth-submit-btn auth-submit-btn--link">
            Open dashboard
          </Link>
        </div>
      ) : waitingCode ? (
        <div className="auth-pair-waiting">
          {error ? <p className="auth-error">{error}</p> : null}
          <p className="auth-muted">Waiting for your partner to join…</p>
          <div className="auth-invite-code" aria-label="Invite code">
            {waitingCode}
          </div>
          <button
            type="button"
            className="auth-secondary-btn"
            onClick={() => handleCopy(waitingCode)}
          >
            {copied ? 'Copied!' : 'Copy invite code'}
          </button>
          <p className="auth-muted auth-muted--small">
            Already have a code from them instead?{' '}
            <button
              type="button"
              className="auth-inline-btn"
              onClick={() =>
                setStatus({ paired: false, couple: null, partner: null })
              }
            >
              Enter it here
            </button>
          </p>
        </div>
      ) : (
        <div className="auth-pair-actions">
          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-mode-toggle" role="tablist" aria-label="Pairing mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'create'}
              className={mode === 'create' ? 'auth-mode-btn is-active' : 'auth-mode-btn'}
              onClick={() => setMode('create')}
            >
              Invite partner
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'join'}
              className={mode === 'join' ? 'auth-mode-btn is-active' : 'auth-mode-btn'}
              onClick={() => setMode('join')}
            >
              Join with code
            </button>
          </div>

          {mode === 'create' ? (
            <div className="auth-pair-panel">
              <p className="auth-muted">
                Generate a one-time invite code and send it to your partner.
              </p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={handleCreateInvite}
                disabled={submitting}
              >
                {submitting ? 'Creating invite…' : 'Create invite code'}
              </button>
            </div>
          ) : (
            <form className="auth-form auth-pair-panel" onSubmit={handleJoin}>
              <p className="auth-muted">Paste the invite code your partner shared with you.</p>
              <div className="auth-field">
                <label htmlFor="inviteCode">Invite code</label>
                <input
                  id="inviteCode"
                  type="text"
                  name="inviteCode"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="e.g. 8f3c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? 'Joining…' : 'Join your partner'}
              </button>
            </form>
          )}
        </div>
      )}
    </AuthShell>
  )
}
