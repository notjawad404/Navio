import { useState, useRef, useEffect } from 'react'
import { updateUserAttributes, confirmUserAttribute, updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../context/AuthContext'
import { uploadProfileImage } from '../lib/upload'

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

export default function ProfilePage() {
  const { userAttrs, checking, reload } = useAuth()

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError]     = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [verifyMode, setVerifyMode]   = useState(false)
  const [verifyCode, setVerifyCode]   = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  const [pw, setPw]         = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwError, setPwError]       = useState('')
  const [pwSuccess, setPwSuccess]   = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (userAttrs) {
      setName(userAttrs.name ?? '')
      setEmail(userAttrs.email ?? '')
    }
  }, [userAttrs])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)
    try {
      const attrs = { name }

      if (imageFile) {
        const pictureUrl = await uploadProfileImage(imageFile)
        attrs.picture = pictureUrl
      }

      if (email !== userAttrs?.email) {
        attrs.email = email
      }

      const result = await updateUserAttributes({ userAttributes: attrs })

      const emailStep = result?.email?.nextStep?.updateAttributeStep
      if (emailStep === 'CONFIRM_ATTRIBUTE_WITH_CODE') {
        setVerifyMode(true)
        setProfileSuccess('Details saved. Please verify your new email address.')
      } else {
        setProfileSuccess('Profile updated successfully.')
      }

      await reload()
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setVerifyError('')
    setVerifyLoading(true)
    try {
      await confirmUserAttribute({ userAttributeKey: 'email', confirmationCode: verifyCode })
      setVerifyMode(false)
      setVerifyCode('')
      setProfileSuccess('Email verified successfully.')
      await reload()
    } catch (err) {
      setVerifyError(err.message)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (!passwordRules.every(r => r.test(pw.next))) {
      setPwError('New password does not meet the requirements.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('New passwords do not match.')
      return
    }

    setPwLoading(true)
    try {
      await updatePassword({ oldPassword: pw.current, newPassword: pw.next })
      setPwSuccess('Password updated successfully.')
      setPw({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const avatar    = imagePreview || userAttrs?.picture
  const initials  = (userAttrs?.name ?? '?')[0]?.toUpperCase()
  const emailChanged = email !== (userAttrs?.email ?? '')

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* ── Account Details ── */}
      <form
        onSubmit={handleProfileSave}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-gray-800">Account Details</h2>

        {/* Avatar picker */}
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="group relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors flex items-center justify-center bg-indigo-50 shrink-0"
          >
            {avatar ? (
              <>
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              </>
            ) : (
              <span className="text-2xl font-semibold text-indigo-600">{initials}</span>
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile Photo</p>
            <p className="text-xs text-gray-400">
              {imageFile ? imageFile.name : 'Click photo to change'}
            </p>
          </div>
        </div>

        {/* Full name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          {emailChanged && (
            <p className="text-xs text-amber-600">Changing email requires verification — a code will be sent to the new address.</p>
          )}
        </div>

        {profileError   && <p className="text-sm text-red-500">{profileError}</p>}
        {profileSuccess && !verifyMode && <p className="text-sm text-green-600">{profileSuccess}</p>}

        <button
          type="submit"
          disabled={profileLoading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {profileLoading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* ── Email verification ── */}
      {verifyMode && (
        <form
          onSubmit={handleVerify}
          className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-amber-800">Verify new email</h2>
          <p className="text-sm text-amber-700">
            A verification code was sent to <strong>{email}</strong>. Enter it below to confirm the change.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            required
            className="w-full rounded-lg border border-amber-300 px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white tracking-widest"
          />
          {verifyError && <p className="text-sm text-red-500">{verifyError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={verifyLoading || verifyCode.length < 6}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyLoading ? 'Verifying…' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={() => { setVerifyMode(false); setVerifyCode('') }}
              className="rounded-lg border border-amber-300 px-5 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Change Password ── */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>

        {/* Current password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <div className="relative">
            <input
              type={showPw.current ? 'text' : 'password'}
              value={pw.current}
              onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon visible={showPw.current} />
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <div className="relative">
            <input
              type={showPw.next ? 'text' : 'password'}
              value={pw.next}
              onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => ({ ...p, next: !p.next }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon visible={showPw.next} />
            </button>
          </div>
          {pw.next.length > 0 && (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-1 pt-1">
              {passwordRules.map(rule => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${rule.test(pw.next) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <span className="text-base leading-none">{rule.test(pw.next) ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Confirm new password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPw.confirm ? 'text' : 'password'}
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon visible={showPw.confirm} />
            </button>
          </div>
          {pw.confirm.length > 0 && pw.next !== pw.confirm && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        {pwError   && <p className="text-sm text-red-500">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-green-600">{pwSuccess}</p>}

        <button
          type="submit"
          disabled={pwLoading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pwLoading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
