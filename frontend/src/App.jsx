import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthFlow from './components/auth/AuthFlow'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import TripsPage from './pages/TripsPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoutes() {
  const { user, checking, reload } = useAuth()

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthFlow onAuthenticated={reload} />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"        element={<HomePage />} />
        <Route path="/plan"    element={<PlanPage />} />
        <Route path="/trips"   element={<TripsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
