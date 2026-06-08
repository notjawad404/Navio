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

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
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

    if (!imageFile) {
      setError('Please upload a profile photo.')
      return
    }
    if (!allRulesPassed) {
      setError('Password does not meet the requirements below.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      setLoadingStep('Uploading photo…')
      const pictureUrl = await uploadProfileImage(imageFile)

      setLoadingStep('Creating account…')
      await signUp({
        username: form.email,
        password: form.password,
        options: {
          userAttributes: {
            email: form.email,
            name: form.name,
            picture: pictureUrl,
          },
        },
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-gray-900">Create account</h2>

      {/* Profile photo picker */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="group relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-400 overflow-hidden transition-colors bg-gray-50 hover:bg-indigo-50 flex items-center justify-center"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadIcon />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadIcon />
            </div>
          )}
        </button>
        <p className="text-xs text-gray-500">
          {imageFile ? imageFile.name : 'Click to upload profile photo'}
        </p>
      </div>

      {/* Full name */}
      <input
        name="name"
        type="text"
        placeholder="Full name"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      {/* Email */}
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
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
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="button"
          onClick={() => setShowConfirm(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
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
        {loading ? loadingStep : 'Sign Up'}
      </button>
    </form>
  )
}
