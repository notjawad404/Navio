import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthFlow from './components/auth/AuthFlow'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoutes() {
  const { user, checking, reload } = useAuth()
  const [authView, setAuthView] = useState(null) // null | 'signin' | 'signup'

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!user) {
    if (authView) {
      return (
        <AuthFlow
          onAuthenticated={reload}
          initialScreen={authView}
          onBack={() => setAuthView(null)}
        />
      )
    }
    return (
      <LandingPage
        onGetStarted={() => setAuthView('signup')}
        onSignIn={() => setAuthView('signin')}
      />
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"               element={<HomePage />} />
        <Route path="/plan"           element={<PlanPage />} />
        <Route path="/trips"          element={<TripsPage />} />
        <Route path="/trips/:tripId"  element={<TripDetailPage />} />
        <Route path="/profile"        element={<ProfilePage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
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
