import { useState, useEffect, useRef } from 'react'
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth'

const RESEND_COOLDOWN = 60

export default function ConfirmSignUp({ email, onSuccess, onChangeEmail }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendSending, setResendSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendSending(true)
    setError('')
    try {
      await resendSignUpCode({ username: email })
      startCountdown()
    } catch (err) {
      setError(err.message)
    } finally {
      setResendSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-gray-900">Verify email</h2>

      <p className="text-sm text-gray-500">
        A 6-digit code was sent to{' '}
        <span className="font-medium text-gray-700">{email}</span>
      </p>

      <input
        type="text"
        inputMode="numeric"
        placeholder="Enter code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 tracking-widest text-center text-lg"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Verifying…' : 'Confirm'}
      </button>

      {/* Secondary actions */}
      <div className="flex items-center justify-between pt-1 text-sm text-gray-500">
        <button
          type="button"
          onClick={onChangeEmail}
          className="hover:text-indigo-600 hover:underline transition-colors"
        >
          Wrong email? Change it
        </button>

        {countdown > 0 ? (
          <span className="tabular-nums text-gray-400">
            Resend in 0:{String(countdown).padStart(2, '0')}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSending}
            className="hover:text-indigo-600 hover:underline transition-colors disabled:opacity-50"
          >
            {resendSending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
    </form>
  )
}
