import './ErrorBanner.css'

/**
 * @param {string} [errorMessage]
 * @returns {string}
 */
function formatErrorMessage(errorMessage) {
  if (!errorMessage) return ''

  return errorMessage
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/**
 * @param {Object} props
 * @param {string | null} [props.message]
 * @param {string | null} [props.errorMessage]
 * @param {() => void} [props.onDismiss]
 */
export default function ErrorBanner({ message, errorMessage, onDismiss }) {
  const text = formatErrorMessage(message ?? errorMessage ?? '')
  if (!text) return null

  return (
    <div className="error-banner" role="alert">
      <p className="error-banner__text">{text}</p>
      {onDismiss ? (
        <button
          type="button"
          className="error-banner__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          {'\u00D7'}
        </button>
      ) : null}
    </div>
  )
}
