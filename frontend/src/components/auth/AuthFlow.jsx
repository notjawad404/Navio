import { useState } from 'react'
import SignUp from './SignUp'
import ConfirmSignUp from './ConfirmSignUp'
import SignIn from './SignIn'
import ForgotPassword from './ForgotPassword'
import ResetCode from './ResetCode'
import NewPassword from './NewPassword'

const DESTINATIONS = [
  { emoji: '🗼', name: 'Paris',      tilt: '-rotate-2' },
  { emoji: '🗻', name: 'Kyoto',      tilt: 'rotate-1'  },
  { emoji: '🏛️',  name: 'Rome',       tilt: 'rotate-0'  },
  { emoji: '🌊', name: 'Santorini',  tilt: 'rotate-2'  },
  { emoji: '🏝️',  name: 'Bali',       tilt: '-rotate-1' },
  { emoji: '🕌', name: 'Istanbul',   tilt: 'rotate-1'  },
  { emoji: '🌸', name: 'Tokyo',      tilt: '-rotate-2' },
  { emoji: '🗽', name: 'New York',   tilt: 'rotate-2'  },
  { emoji: '🏔️',  name: 'Swiss Alps', tilt: '-rotate-1' },
]

function BrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 shrink-0 flex-col items-center justify-center bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-700 px-12 py-16 text-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/20" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xs w-full">
        {/* Logo */}
        <div className="mb-1 text-4xl font-bold tracking-tight">Navio</div>
        <div className="mb-8 text-2xl text-indigo-300">✦</div>

        {/* Tagline */}
        <h2 className="mb-3 text-2xl font-bold leading-snug">
          Your AI travel companion
        </h2>
        <p className="mb-10 text-sm leading-relaxed text-indigo-200">
          Tell us where you want to go —<br />we'll plan every detail.
        </p>

        {/* Destination tags mosaic */}
        <div className="flex flex-wrap justify-center gap-2">
          {DESTINATIONS.map(({ emoji, name, tilt }) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm ${tilt}`}
            >
              {emoji} {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Screens: 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset-code' | 'new-password'
export default function AuthFlow({ onAuthenticated, initialScreen = 'signin', onBack }) {
  const [screen, setScreen] = useState(initialScreen)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingResetCode, setPendingResetCode] = useState('')

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Left: form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Logo + back */}
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-indigo-600 tracking-tight">Navio</span>
              <span className="text-indigo-400 text-xl leading-none">✦</span>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-lg">

            {screen === 'signin' && (
              <>
                <SignIn
                  onSuccess={onAuthenticated}
                  onForgotPassword={() => setScreen('forgot')}
                />
                <p className="mt-6 text-center text-sm text-gray-500">
                  No account?{' '}
                  <button type="button" className="font-medium text-indigo-600 hover:underline" onClick={() => setScreen('signup')}>
                    Sign up
                  </button>
                </p>
              </>
            )}

            {screen === 'signup' && (
              <>
                <SignUp
                  onSuccess={(email) => { setPendingEmail(email); setScreen('confirm') }}
                  initialEmail={pendingEmail}
                />
                <p className="mt-6 text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button type="button" className="font-medium text-indigo-600 hover:underline" onClick={() => setScreen('signin')}>
                    Sign in
                  </button>
                </p>
              </>
            )}

            {screen === 'confirm' && (
              <ConfirmSignUp
                email={pendingEmail}
                onSuccess={() => setScreen('signin')}
                onChangeEmail={() => setScreen('signup')}
              />
            )}

            {screen === 'forgot' && (
              <ForgotPassword
                onCodeSent={(email) => { setPendingEmail(email); setScreen('reset-code') }}
                onBack={() => setScreen('signin')}
              />
            )}

            {screen === 'reset-code' && (
              <ResetCode
                email={pendingEmail}
                onVerified={(code) => { setPendingResetCode(code); setScreen('new-password') }}
                onChangeEmail={() => setScreen('forgot')}
              />
            )}

            {screen === 'new-password' && (
              <NewPassword
                email={pendingEmail}
                code={pendingResetCode}
                onSuccess={() => setScreen('signin')}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Right: branding panel ── */}
      <BrandingPanel />
    </div>
  )
}
