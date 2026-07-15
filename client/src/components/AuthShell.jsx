import { Link } from 'react-router-dom'
import './AuthForm.css'

export default function AuthShell({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb--one" aria-hidden="true" />
      <div className="auth-orb auth-orb--two" aria-hidden="true" />
      <div className="auth-orb auth-orb--three" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-card__badge">♥ for two</div>
        <h1 className="auth-card__title">{title}</h1>
        <p className="auth-card__subtitle">{subtitle}</p>
        {children}
        <p className="auth-card__footer">
          {footerText}{' '}
          <Link to={footerLink} className="auth-link-btn">
            {footerLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
