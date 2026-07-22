import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactNode}
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner label="Checking your session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
