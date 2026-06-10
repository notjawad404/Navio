import { useState, useEffect, useRef } from 'react'
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth'

const RESEND_COOLDOWN = 60

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      {message}
    </div>
  )
}

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
        if (prev <= 1) { clearInterval(intervalRef.current); return 0 }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-700">{email}</span>.{' '}
          <button type="button" onClick={onChangeEmail} className="text-indigo-600 hover:underline transition-colors">
            Not you?
          </button>
        </p>
      </div>

      {/* OTP input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Verification code
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-mono tracking-[0.6em] text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? 'Verifying…' : 'Confirm Email'}
      </button>

      <div className="text-center text-sm text-gray-500">
        {countdown > 0 ? (
          <span className="tabular-nums text-gray-400">
            Resend available in 0:{String(countdown).padStart(2, '0')}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSending}
            className="text-indigo-600 hover:underline transition-colors disabled:opacity-50"
          >
            {resendSending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
    </form>
  )
}
