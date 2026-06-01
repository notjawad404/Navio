import { useState } from 'react'
import { resetPassword } from 'aws-amplify/auth'

export default function ForgotPassword({ onCodeSent, onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword({ username: email })
      onCodeSent(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Reset password</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending…' : 'Send reset code'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-indigo-600 hover:underline transition-colors"
      >
        ← Back to sign in
      </button>
    </form>
  )
}
