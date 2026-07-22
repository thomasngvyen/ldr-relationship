import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import ErrorBanner from '../components/ErrorBanner'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await registerUser({ displayName, email, password })
      navigate('/pair')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create your account. Please try again.';
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your space"
      subtitle="Register to start your shared countdown and message board."
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <div className="auth-field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What should we call you?"
            autoComplete="nickname"
            minLength={3}
            maxLength={20}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            maxLength={32}
            required
          />
        </div>

        <button type="submit" className="auth-submit-btn" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
