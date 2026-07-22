import { Hearts } from 'react-loader-spinner'
import './LoadingSpinner.css'

/**
 * @param {Object} props
 * @param {string} [props.label]
 * @param {number} [props.size]
 */
export default function LoadingSpinner({ label = '', size = 72 } = {}) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <Hearts
        height={size}
        width={size}
        color="#f472b6"
        visible
        ariaLabel="hearts-loading"
      />
      {label ? <p className="loading-spinner__label">{label}</p> : null}
      {!label ? <span className="sr-only">Loading</span> : null}
    </div>
  )
}
