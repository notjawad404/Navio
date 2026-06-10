import { useState, useRef } from 'react'
import { signUp } from 'aws-amplify/auth'
import { uploadProfileImage } from '../../lib/upload'

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100'

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

export default function SignUp({ onSuccess, initialEmail = '' }) {
  const [form, setForm] = useState({ name: '', email: initialEmail, password: '', confirmPassword: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const fileInputRef = useRef(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const allRulesPassed = passwordRules.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!imageFile) { setError('Please upload a profile photo.'); return }
    if (!allRulesPassed) { setError('Password does not meet the requirements below.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      setLoadingStep('Uploading photo…')
      const pictureUrl = await uploadProfileImage(imageFile)
      setLoadingStep('Creating account…')
      await signUp({
        username: form.email,
        password: form.password,
        options: { userAttributes: { email: form.email, name: form.name, picture: pictureUrl } },
      })
      onSuccess(form.email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
        <p className="mt-1 text-sm text-gray-500">Join Navio and start planning smarter trips</p>
      </div>

      {/* Photo picker */}
      <div className="flex flex-col items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-indigo-500 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          )}
        </button>
        <p className="text-xs text-gray-400">{imageFile ? imageFile.name : 'Add profile photo'}</p>
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full name</label>
        <input name="name" type="text" placeholder="Jane Smith" value={form.name} onChange={handleChange} required className={inputCls} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
        <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className={inputCls} />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className={`${inputCls} pr-10`}
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
            className={`${inputCls} pr-10`}
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
        {loading ? loadingStep : 'Create Account'}
      </button>
    </form>
  )
}
