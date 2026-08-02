import { useState } from 'react'
import {
  isPushSupported,
  needsHomeScreenInstall,
  subscribeToPush,
} from '../lib/push'
import './EnableNotifications.css'

/**
 * Prompt to enable Web Push. Must be triggered by a user gesture.
 */
export default function EnableNotifications() {
  const [status, setStatus] = useState(/** @type {'idle' | 'working' | 'done' | 'error'} */ ('idle'))
  const [message, setMessage] = useState('')

  if (!isPushSupported() && !needsHomeScreenInstall()) {
    return null
  }

  /**
   * @param {React.MouseEvent<HTMLButtonElement>} event
   */
  async function handleEnable(event) {
    event.preventDefault()
    setStatus('working')
    setMessage('')

    try {
      const result = await subscribeToPush()
      if (result.ok) {
        setStatus('done')
        setMessage('Notifications enabled. Your partner’s updates can reach this device.')
        return
      }
      setStatus('error')
      setMessage(result.reason ?? 'Could not enable notifications.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not enable notifications.')
    }
  }

  if (status === 'done') {
    return (
      <div className="enable-notifications enable-notifications--done" role="status">
        <p>{message}</p>
      </div>
    )
  }

  return (
    <div className="enable-notifications">
      <div className="enable-notifications__copy">
        <h2 className="enable-notifications__title">Stay in sync</h2>
        <p className="enable-notifications__text">
          {needsHomeScreenInstall()
            ? 'On iPhone, tap Share → Add to Home Screen, open HeartSync from there, then enable notifications.'
            : 'Turn on notifications so you know when your partner shares a feeling.'}
        </p>
      </div>
      {!needsHomeScreenInstall() && (
        <button
          type="button"
          className="enable-notifications__button"
          onClick={handleEnable}
          disabled={status === 'working'}
        >
          {status === 'working' ? 'Enabling…' : 'Enable notifications'}
        </button>
      )}
      {status === 'error' && message ? (
        <p className="enable-notifications__error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  )
}
