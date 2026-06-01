import { useState, useEffect, useRef } from 'react'
import { resetPassword } from 'aws-amplify/auth'

const RESEND_COOLDOWN = 60

export default function ResetCode({ email, onVerified, onChangeEmail }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resendSending, setResendSending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const intervalRef = useRef(null)

  useEffect(() => {
    startCountdown()
    return () => clearInterval(intervalRef.current)
  }, [])

  const startCountdown = () => {
    clearInterval(intervalRef.current)
    setCountdown(RESEND_COOLDOWN)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return }
    onVerified(code)
  }

  const handleResend = async () => {
    setResendSending(true)
    setError('')
    try {
      await resetPassword({ username: email })
      startCountdown()
    } catch (err) {
      setError(err.message)
    } finally {
      setResendSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Check your email</h2>
        <p className="mt-1 text-sm text-gray-500">
          A reset code was sent to{' '}
          <span className="font-medium text-gray-700">{email}</span>
          {' '}
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-gray-400 hover:text-indigo-600 hover:underline transition-colors"
          >
            (not you?)
          </button>
        </p>
      </div>

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
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Continue
      </button>

      <div className="flex justify-end text-sm text-gray-500">
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
