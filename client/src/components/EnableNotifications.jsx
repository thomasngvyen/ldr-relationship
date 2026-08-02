import { useCallback, useEffect, useState } from 'react'
import {
  isPushEnabled,
  isPushSupported,
  needsHomeScreenInstall,
  subscribeToPush,
} from '../lib/push'
import './EnableNotifications.css'

/**
 * @typedef {'checking' | 'hidden' | 'prompt' | 'working' | 'error'} EnableNotifView
 */

/**
 * Prompt to enable Web Push. Hidden when push is already active.
 * Must be triggered by a user gesture to subscribe.
 */
export default function EnableNotifications() {
  const [view, setView] = useState(
    /** @type {EnableNotifView} */ ('checking'),
  )
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!isPushSupported() && !needsHomeScreenInstall()) {
      setView('hidden')
      return
    }

    // iOS Safari in browser tab: still show Home Screen instructions
    if (needsHomeScreenInstall()) {
      setView('prompt')
      return
    }

    if (!isPushSupported()) {
      setView('hidden')
      return
    }

    const enabled = await isPushEnabled()
    setView(enabled ? 'hidden' : 'prompt')
    if (enabled) setMessage('')
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      await refresh()
      if (cancelled) return
    }

    run()

    function onVisible() {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [refresh])

  /**
   * @param {React.MouseEvent<HTMLButtonElement>} event
   */
  async function handleEnable(event) {
    event.preventDefault()
    setView('working')
    setMessage('')

    try {
      const result = await subscribeToPush()
      if (result.ok) {
        setView('hidden')
        return
      }
      setView('error')
      setMessage(result.reason ?? 'Could not enable notifications.')
    } catch (err) {
      setView('error')
      setMessage(err instanceof Error ? err.message : 'Could not enable notifications.')
    }
  }

  if (view === 'checking' || view === 'hidden') {
    return null
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
          disabled={view === 'working'}
        >
          {view === 'working' ? 'Enabling…' : 'Enable notifications'}
        </button>
      )}
      {view === 'error' && message ? (
        <p className="enable-notifications__error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  )
}
