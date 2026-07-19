import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/dashboard'
import Login from './pages/login'
import Pair from './pages/pair'
import Register from './pages/register'
import Visits from './pages/visits'
import Moods from './pages/moods'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pair"
          element={
            <ProtectedRoute>
              <Pair />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visits"
          element={
            <ProtectedRoute>
              <Visits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moods"
          element={
            <ProtectedRoute>
              <Moods />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  )
}

export default App
