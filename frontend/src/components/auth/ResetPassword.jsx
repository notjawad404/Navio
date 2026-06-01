import { useState, useEffect, useRef } from 'react'
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth'

const RESEND_COOLDOWN = 60

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function ResetPassword({ email, onSuccess }) {
  const [form, setForm] = useState({ code: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const allRulesPassed = passwordRules.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!allRulesPassed) { setError('Password does not meet the requirements below.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await confirmResetPassword({ username: email, confirmationCode: form.code, newPassword: form.password })
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
        <h2 className="text-2xl font-semibold text-gray-900">New password</h2>
        <p className="mt-1 text-sm text-gray-500">
          A reset code was sent to{' '}
          <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      {/* Reset code */}
      <input
        name="code"
        type="text"
        inputMode="numeric"
        placeholder="Reset code"
        value={form.code}
        onChange={handleChange}
        maxLength={6}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 tracking-widest text-center text-lg"
      />

      {/* New password */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <EyeIcon visible={showPassword} />
          </button>
        </div>

        {form.password.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
            {passwordRules.map(rule => (
              <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="text-base leading-none">{rule.test(form.password) ? '✓' : '○'}</span>
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm password */}
      <div className="relative">
        <input
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <EyeIcon visible={showConfirm} />
        </button>
      </div>
      {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
        <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Resetting…' : 'Reset password'}
      </button>

      <div className="flex justify-end pt-1 text-sm text-gray-500">
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
