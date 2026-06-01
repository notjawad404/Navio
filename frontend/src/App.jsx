import { useState, useEffect } from 'react'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import AuthFlow from './components/auth/AuthFlow'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthFlow onAuthenticated={() => getCurrentUser().then(setUser)} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="mb-2 text-3xl font-bold text-indigo-600">Navio</h1>
        <p className="text-gray-500 text-sm mb-1">Welcome back</p>
        <p className="font-medium text-gray-800 mb-6">{user.signInDetails?.loginId}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
