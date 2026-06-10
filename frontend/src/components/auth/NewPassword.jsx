import { useState } from 'react'
import { confirmResetPassword } from 'aws-amplify/auth'

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100'

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

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

export default function NewPassword({ email, code, onSuccess }) {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const allRulesPassed = passwordRules.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!allRulesPassed) { setError('Password does not meet the requirements below.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword: form.password })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New password</h2>
        <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
      </div>

      {/* New password */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">New password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className={inputCls}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <EyeIcon visible={showPassword} />
            </button>
          </div>
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confirm password</label>
        <div className="relative">
          <input
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className={inputCls}
          />
          <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <EyeIcon visible={showConfirm} />
          </button>
        </div>
        {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? 'Saving…' : 'Set New Password'}
      </button>
    </form>
  )
}
